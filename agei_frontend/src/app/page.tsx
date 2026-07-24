import VerifiableTimeline from '@/components/VerifiableTimeline';
import VerificationJobRunner from '@/components/VerificationJobRunner';
import ShadowAIDashboard from '@/components/ShadowAIDashboard';

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-gray-100 p-8">
      <div className="max-w-7xl mx-auto space-y-16">
        
        {/* Header */}
        <header className="border-b border-gray-800 pb-8">
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-400 via-emerald-400 to-purple-400 text-transparent bg-clip-text">
            CognitiveInsight (AGEI Platform)
          </h1>
          <p className="text-gray-400 mt-2 text-lg">
            AI Governance Evidence Infrastructure backed by the CIAF-LCM framework.
          </p>
        </header>

        {/* Section 1: Shadow AI Dashboard */}
        <section>
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-gray-200">Shadow AI Discovery</h2>
            <p className="text-sm text-gray-500">Route and classify unsanctioned tools detected in the environment.</p>
          </div>
          <ShadowAIDashboard />
        </section>

        {/* Section 2: Timeline & Job Runner Grid */}
        <section className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
          <div>
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-200">Evidence Lineage</h2>
              <p className="text-sm text-gray-500">Immutable chain of gate evaluations and receipt batches.</p>
            </div>
            <VerifiableTimeline />
          </div>
          
          <div>
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-200">Compliance Verification</h2>
              <p className="text-sm text-gray-500">Cryptographically prove adherence to the standard.</p>
            </div>
            <VerificationJobRunner />
          </div>
        </section>
        
      </div>
    </main>
  );
}
