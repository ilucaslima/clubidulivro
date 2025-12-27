"use client";

export default function FirebaseConfigError() {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-8">
      <div className="bg-red-900/20 border border-red-500 rounded-lg p-8 max-w-2xl">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-red-400 mb-2">
            ⚠️ Configuração Firebase
          </h1>
          <p className="text-red-300">
            O Firebase Authentication não está configurado
          </p>
        </div>

        <div className="bg-slate-800 p-4 rounded text-sm text-slate-300 space-y-4">
          <div>
            <h3 className="font-bold text-white mb-2">
              📋 Para configurar o Firebase:
            </h3>
            <ol className="list-decimal list-inside space-y-2 ml-4">
              <li>
                Acesse o{" "}
                <a
                  href="https://console.firebase.google.com"
                  target="_blank"
                  className="text-blue-400 underline"
                >
                  Console Firebase
                </a>
              </li>
              <li>Selecione o projeto "clubidulivro"</li>
              <li>
                No menu lateral, clique em <strong>"Authentication"</strong>
              </li>
              <li>
                Clique em <strong>"Get Started"</strong> para inicializar
              </li>
              <li>
                Na aba <strong>"Sign-in method"</strong>, habilite:
              </li>
              <ul className="list-disc list-inside ml-4 mt-2">
                <li>
                  <strong>Email/Password</strong> - Ativado
                </li>
              </ul>
              <li>
                No menu lateral, clique em <strong>"Firestore Database"</strong>
              </li>
              <li>
                Clique em <strong>"Create database"</strong>
              </li>
              <li>
                Escolha <strong>"Start in test mode"</strong> (por enquanto)
              </li>
              <li>Selecione uma localização (ex: us-central1)</li>
            </ol>
          </div>

          <div className="border-t border-slate-600 pt-4">
            <h4 className="font-bold text-white mb-2">
              🔧 Regras do Firestore (opcional):
            </h4>
            <p className="text-xs">
              Para maior segurança, configure as regras do Firestore:
            </p>
            <pre className="bg-slate-900 p-3 rounded mt-2 text-xs overflow-x-auto">
              {`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own profile
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Users can read all profiles and write their own progress
    match /users/{document=**} {
      allow read: if request.auth != null;
    }
    
    match /progress/{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
  }
}`}
            </pre>
          </div>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => window.location.reload()}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md font-medium transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    </div>
  );
}
