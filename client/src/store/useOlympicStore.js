import { create } from 'zustand';

const useOlympicStore = create((set) => ({
  olympic: null,
  leaderboard: [],
  participantName: null,
  isHost: false,
  connected: false,
  socketError: null,

  setOlympic: (olympic) => set({ olympic }),
  setLeaderboard: (leaderboard) => set({ leaderboard }),
  setParticipantName: (participantName) => set({ participantName }),
  setIsHost: (isHost) => set({ isHost }),
  setConnected: (connected) => set({ connected }),
  setSocketError: (socketError) => set({ socketError }),

  updateFromRoomEvent: ({ olympic, leaderboard }) =>
    set({ olympic, leaderboard: leaderboard || [] }),

  reset: () =>
    set({
      olympic: null,
      leaderboard: [],
      participantName: null,
      isHost: false,
      connected: false,
      socketError: null,
    }),
}));

export default useOlympicStore;
