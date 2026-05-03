import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileText } from "lucide-react";

export default function ImpressumPage() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Impressum | Party Olympiade";
  }, []);

  return (
    <div className="min-h-screen px-4 py-12">
      <div className="max-w-2xl mx-auto animate-slide-up">
        <button className="btn-ghost mb-8" onClick={() => navigate(-1)}>
          <span className="flex items-center gap-1.5"><ArrowLeft size={14} /> Zurück</span>
        </button>

        <div
          className="rounded-2xl p-8"
          style={{
            background: "rgba(12,15,35,0.8)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div className="flex items-center gap-3 mb-8">
            <FileText size={22} className="text-purple-400" />
            <h1 className="text-2xl font-black text-white">Impressum</h1>
          </div>

          <div className="space-y-6 text-sm text-white/70 leading-relaxed">
            <section>
              <h2 className="text-white font-bold mb-2 text-base">Angaben gemäß § 5 TMG</h2>
              <p>[Dein Name / Unternehmensname]</p>
              <p>[Straße und Hausnummer]</p>
              <p>[PLZ und Ort]</p>
              <p>[Land]</p>
            </section>

            <section>
              <h2 className="text-white font-bold mb-2 text-base">Kontakt</h2>
              <p>E-Mail: <a href="mailto:[deine@email.de]" className="text-purple-400 hover:text-purple-300 transition-colors">[deine@email.de]</a></p>
            </section>

            <section>
              <h2 className="text-white font-bold mb-2 text-base">Haftungsausschluss</h2>
              <p className="mb-3">
                Die Inhalte dieser Website wurden mit größtmöglicher Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte übernehme ich jedoch keine Gewähr.
              </p>
              <p>
                Als Betreiber bin ich gemäß § 7 Abs. 1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG bin ich als Diensteanbieter jedoch nicht unter der Verpflichtung, übermittelte oder gespeicherte fremde Informationen zu überwachen.
              </p>
            </section>

            <section>
              <h2 className="text-white font-bold mb-2 text-base">Streitschlichtung</h2>
              <p>
                Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{" "}
                <span className="text-purple-400">https://ec.europa.eu/consumers/odr/</span>. Meine E-Mail-Adresse finden Sie oben im Impressum. Ich bin nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
              </p>
            </section>
          </div>

          <p className="text-white/25 text-xs mt-8">
            Bitte ersetze die Platzhalter in eckigen Klammern durch deine echten Kontaktdaten.
          </p>
        </div>
      </div>
    </div>
  );
}
