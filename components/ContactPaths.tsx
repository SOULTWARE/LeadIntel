"use client";

export interface ContactPathsProps {
  contactPaths: {
    phone: { value: string; verified: boolean } | null;
    email: { value: string; verified: boolean } | null;
    website: string | null;
    linkedin: string | null;
  };
  onVerifyContact: (type: "phone" | "email") => void;
}

export function ContactPaths({ contactPaths, onVerifyContact }: ContactPathsProps) {
  const hasAnyContact = contactPaths.phone || contactPaths.email || contactPaths.website || contactPaths.linkedin;

  if (!hasAnyContact) {
    return (
      <section className="bg-white rounded-lg border border-gray-200 p-4">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Contact Paths</h2>
        <p className="text-sm text-gray-500 italic">No contact information found</p>
      </section>
    );
  }

  return (
    <section className="bg-white rounded-lg border border-gray-200 p-4">
      <h2 className="text-sm font-semibold text-gray-900 mb-3">Contact Paths</h2>

      <div className="space-y-3">
        {/* Email */}
        {contactPaths.email && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-sm">📧</span>
              <a
                href={`mailto:${contactPaths.email.value}`}
                className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
              >
                {contactPaths.email.value}
              </a>
              {contactPaths.email.verified ? (
                <span className="text-xs text-green-600 font-medium">✓ Verified</span>
              ) : (
                <button
                  onClick={() => onVerifyContact("email")}
                  className="text-xs text-yellow-600 hover:text-yellow-800 font-medium underline"
                >
                  Verify
                </button>
              )}
            </div>
          </div>
        )}

        {/* Phone */}
        {contactPaths.phone && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-sm">📞</span>
              <a
                href={`tel:${contactPaths.phone.value}`}
                className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
              >
                {contactPaths.phone.value}
              </a>
              {contactPaths.phone.verified ? (
                <span className="text-xs text-green-600 font-medium">✓ Verified</span>
              ) : (
                <button
                  onClick={() => onVerifyContact("phone")}
                  className="text-xs text-yellow-600 hover:text-yellow-800 font-medium underline"
                >
                  Verify
                </button>
              )}
            </div>
          </div>
        )}

        {/* Website */}
        {contactPaths.website && (
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm">🌐</span>
            <a
              href={contactPaths.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
            >
              {contactPaths.website.replace(/^https?:\/\//, "")}
            </a>
          </div>
        )}

        {/* LinkedIn */}
        {contactPaths.linkedin && (
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm">💼</span>
            <a
              href={contactPaths.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
            >
              LinkedIn Profile
            </a>
          </div>
        )}
      </div>
    </section>
  );
}

export default ContactPaths;
