import Olympic from "../models/Olympic.js";
import { computeLeaderboard } from "../utils/scoring.js";

export function initSocket(io) {
  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    /**
     * join-room — join a room by Olympic code
     * payload: { code, name, isHost, hostToken? }
     */
    socket.on(
      "join-room",
      async ({ code, name, isHost, hostToken, userId }) => {
        if (!code)
          return socket.emit("error", { message: "Room code required" });

        const upperCode = code.toUpperCase();
        try {
          // Use findOne (not lean) so we can save if needed
          const olympic = await Olympic.findOne({ code: upperCode });
          if (!olympic)
            return socket.emit("error", { message: "Olympic not found" });

          let participantAdded = false;

          // Only accept new players when the room is in lobby state
          if (olympic.status === "draft") {
            return socket.emit("error", {
              message: "This Olympic has not been launched yet",
            });
          }

          // Dynamically add participant when a non-host joins (lobby only)
          if (!isHost && name && name.trim() && olympic.status === "lobby") {
            const trimName = name.trim().slice(0, 30);
            const existing = olympic.participants.find(
              (p) => p.name === trimName,
            );
            if (!existing) {
              if (olympic.participants.length >= (olympic.maxPlayers || 20)) {
                return socket.emit("error", { message: "Room is full" });
              }
              olympic.participants.push({
                name: trimName,
                userId: userId || null,
              });
              await olympic.save();
              participantAdded = true;
            } else if (userId && !existing.userId) {
              // Backfill userId if player rejoins while logged in
              existing.userId = userId;
              await olympic.save();
            }
          }

          socket.join(upperCode);
          socket.data.code = upperCode;
          socket.data.name = name;
          socket.data.isHost = isHost || false;

          const safeOlympic = olympic.toObject();
          delete safeOlympic.hostToken;
          const leaderboard = computeLeaderboard(safeOlympic);

          if (participantAdded) {
            // Broadcast to everyone so all devices see the updated player list
            io.to(upperCode).emit("room-update", {
              olympic: safeOlympic,
              leaderboard,
            });
          } else {
            socket.emit("room-update", { olympic: safeOlympic, leaderboard });
          }

          console.log(`${name || "Anonymous"} joined room ${upperCode}`);
        } catch (err) {
          console.error("join-room error:", err);
          socket.emit("error", { message: "Server error" });
        }
      },
    );

    /**
     * start-olympic — host starts the event (lobby → active)
     * payload: { code, hostToken }
     */
    socket.on("start-olympic", async ({ code, hostToken }) => {
      try {
        const olympic = await Olympic.findOne({ code: code.toUpperCase() });
        if (!olympic)
          return socket.emit("error", { message: "Olympic not found" });
        if (olympic.hostToken !== hostToken)
          return socket.emit("error", { message: "Unauthorized" });

        olympic.status = "active";
        await olympic.save();
        const safe = olympic.toObject();
        delete safe.hostToken;
        const leaderboard = computeLeaderboard(safe);

        io.to(code.toUpperCase()).emit("room-update", {
          olympic: safe,
          leaderboard,
        });
      } catch (err) {
        console.error("start-olympic error:", err);
        socket.emit("error", { message: "Server error" });
      }
    });

    /**
     * navigate — host moves to next/prev game
     * payload: { code, direction, hostToken }
     */
    socket.on("navigate", async ({ code, direction, hostToken }) => {
      try {
        const olympic = await Olympic.findOne({ code: code.toUpperCase() });
        if (!olympic)
          return socket.emit("error", { message: "Olympic not found" });
        if (olympic.hostToken !== hostToken)
          return socket.emit("error", { message: "Unauthorized" });

        const maxIndex = olympic.games.length - 1;
        if (direction === "next" && olympic.currentGameIndex < maxIndex)
          olympic.currentGameIndex += 1;
        else if (direction === "prev" && olympic.currentGameIndex > 0)
          olympic.currentGameIndex -= 1;

        await olympic.save();
        const safe = olympic.toObject();
        delete safe.hostToken;
        const leaderboard = computeLeaderboard(safe);

        io.to(code.toUpperCase()).emit("room-update", {
          olympic: safe,
          leaderboard,
        });
      } catch (err) {
        console.error("navigate error:", err);
        socket.emit("error", { message: "Server error" });
      }
    });

    /**
     * submit-score — host submits result for a game
     * payload: { code, result: { gameId, placements, teams }, hostToken }
     */
    socket.on("submit-score", async ({ code, result, hostToken }) => {
      try {
        const olympic = await Olympic.findOne({ code: code.toUpperCase() });
        if (!olympic)
          return socket.emit("error", { message: "Olympic not found" });
        if (olympic.hostToken !== hostToken)
          return socket.emit("error", { message: "Unauthorized" });

        const { gameId, placements, teams } = result;
        const existingIdx = olympic.results.findIndex(
          (r) => String(r.gameId) === String(gameId),
        );
        const resultData = {
          gameId,
          placements: placements || [],
          teams: teams || [],
        };

        if (existingIdx >= 0) olympic.results[existingIdx] = resultData;
        else olympic.results.push(resultData);

        await olympic.save();
        const safe2 = olympic.toObject();
        delete safe2.hostToken;
        const leaderboard2 = computeLeaderboard(safe2);

        io.to(code.toUpperCase()).emit("room-update", {
          olympic: safe2,
          leaderboard: leaderboard2,
        });
      } catch (err) {
        console.error("submit-score error:", err);
        socket.emit("error", { message: "Server error" });
      }
    });

    /**
     * finish-olympic — host ends the event
     * payload: { code, hostToken }
     */
    socket.on("finish-olympic", async ({ code, hostToken }) => {
      try {
        const olympic = await Olympic.findOne({ code: code.toUpperCase() });
        if (!olympic)
          return socket.emit("error", { message: "Olympic not found" });
        if (olympic.hostToken !== hostToken)
          return socket.emit("error", { message: "Unauthorized" });

        olympic.status = "finished";
        const safe3 = olympic.toObject();
        delete safe3.hostToken;
        const leaderboard3 = computeLeaderboard(safe3);

        // Persist final leaderboard snapshot
        olympic.finalLeaderboard = leaderboard3;
        await olympic.save();

        io.to(code.toUpperCase()).emit("room-update", {
          olympic: safe3,
          leaderboard: leaderboard3,
        });
        io.to(code.toUpperCase()).emit("olympic-finished", {
          code: code.toUpperCase(),
        });
      } catch (err) {
        console.error("finish-olympic error:", err);
        socket.emit("error", { message: "Server error" });
      }
    });

    /**
     * revert-to-draft — host reverts lobby back to draft
     * payload: { code, hostToken }
     */
    socket.on("revert-to-draft", async ({ code, hostToken }) => {
      try {
        const olympic = await Olympic.findOne({ code: code.toUpperCase() });
        if (!olympic)
          return socket.emit("error", { message: "Olympic not found" });
        if (olympic.hostToken !== hostToken)
          return socket.emit("error", { message: "Unauthorized" });
        if (olympic.status !== "lobby" && olympic.status !== "active")
          return socket.emit("error", {
            message: "Can only revert from lobby or active",
          });

        olympic.status = "draft";
        olympic.participants = []; // clear — they'll re-join on next launch
        await olympic.save();

        // Tell all connected sockets in this room (participants get kicked)
        io.to(code.toUpperCase()).emit("olympic-reverted", {
          code: code.toUpperCase(),
        });
      } catch (err) {
        console.error("revert-to-draft error:", err);
        socket.emit("error", { message: "Server error" });
      }
    });

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);
      // If a participant disconnects from the lobby, remove them from participants
      const roomCode = socket.data.code;
      const playerName = socket.data.name;
      const isHost = socket.data.isHost;
      if (roomCode && playerName && !isHost) {
        Olympic.findOne({ code: roomCode, status: "lobby" })
          .then(async (olympic) => {
            if (!olympic) return;
            const before = olympic.participants.length;
            olympic.participants = olympic.participants.filter(
              (p) => p.name !== playerName,
            );
            if (olympic.participants.length !== before) {
              await olympic.save();
              const safe = olympic.toObject();
              delete safe.hostToken;
              io.to(roomCode).emit("room-update", {
                olympic: safe,
                leaderboard: computeLeaderboard(safe),
              });
            }
          })
          .catch(() => {});
      }
    });

    /**
     * edit-games — host reorders or removes games during active olympic
     * payload: { code, hostToken, games }
     */
    socket.on("edit-games", async ({ code, hostToken, games }) => {
      try {
        const upperCode = code.toUpperCase();
        const olympic = await Olympic.findOne({ code: upperCode });
        if (!olympic)
          return socket.emit("error", { message: "Olympic not found" });
        if (olympic.hostToken !== hostToken)
          return socket.emit("error", { message: "Unauthorized" });
        if (!Array.isArray(games) || games.length === 0)
          return socket.emit("error", { message: "At least one game required" });

        // Map to _id strings for quick lookup
        const allowedIds = new Set(olympic.games.map((g) => String(g._id)));
        const newGames = games.filter((g) => allowedIds.has(String(g._id)));
        if (newGames.length === 0)
          return socket.emit("error", { message: "No valid games provided" });

        olympic.games = newGames;
        // Clamp currentGameIndex to valid range
        if (olympic.currentGameIndex >= newGames.length) {
          olympic.currentGameIndex = newGames.length - 1;
        }
        await olympic.save();

        const safe = olympic.toObject();
        delete safe.hostToken;
        io.to(upperCode).emit("room-update", {
          olympic: safe,
          leaderboard: computeLeaderboard(safe),
        });
      } catch (err) {
        console.error("edit-games error:", err);
        socket.emit("error", { message: "Server error" });
      }
    });

    /**
     * kick-player — host removes a player from the lobby
     * payload: { code, hostToken, playerName }
     */
    socket.on("kick-player", async ({ code, hostToken, playerName }) => {
      try {
        const upperCode = code.toUpperCase();
        const olympic = await Olympic.findOne({ code: upperCode });
        if (!olympic)
          return socket.emit("error", { message: "Olympic not found" });
        if (olympic.hostToken !== hostToken)
          return socket.emit("error", { message: "Unauthorized" });

        olympic.participants = olympic.participants.filter(
          (p) => p.name !== playerName,
        );
        await olympic.save();

        // Notify the kicked player's socket to leave
        const sockets = await io.in(upperCode).fetchSockets();
        for (const s of sockets) {
          if (s.data.name === playerName && !s.data.isHost) {
            s.emit("kicked", { playerName });
            s.leave(upperCode);
          }
        }

        const safe = olympic.toObject();
        delete safe.hostToken;
        io.to(upperCode).emit("room-update", {
          olympic: safe,
          leaderboard: computeLeaderboard(safe),
        });
      } catch (err) {
        console.error("kick-player error:", err);
        socket.emit("error", { message: "Server error" });
      }
    });
  });
}
