import GoogleSignInButton from './GoogleSignInButton';

function SignInModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 bg-primary-900 border border-primary-700 rounded-2xl p-10 max-w-md w-full text-center space-y-6 shadow-2xl">
        <h2 className="text-3xl font-heading font-bold text-white">Vidya</h2>
        <div className="space-y-2">
          <h3 className="text-xl font-heading font-semibold text-white">
            Sign in to start learning
          </h3>
          <p className="text-primary-200 font-body text-sm">
            Your personalised learning path is one click away.
          </p>
        </div>
        <GoogleSignInButton />
        <button
          onClick={onClose}
          className="text-primary-300 hover:text-white transition-colors font-body text-sm"
        >
          ← Back
        </button>
      </div>
    </div>
  );
}

export default SignInModal;
