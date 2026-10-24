const GITHUB_INSTALL_ERRORS: Record<string, string> = {
    bad_state: "The GitHub installation link expired. Start the installation again.",
    owned_by_other: "That GitHub installation is already connected to another Zebra account.",
    user_mismatch: "The GitHub installation account does not match the linked GitHub user.",
    org_not_accessible: "The linked GitHub user cannot access that organization installation.",
    suspended: "That GitHub installation is suspended.",
    permissions: "The GitHub App installation must allow only Metadata and Contents read.",
    wrong_app: "That installation belongs to a different GitHub App.",
    missing_installation: "GitHub did not return an installation. An organization owner may still need to approve it.",
};

/** User-facing text for the settings return query. Unknown codes stay generic. */
export function accountLinkErrorMessage(oauthError: string | null, githubError: string | null): string {
    if (githubError && GITHUB_INSTALL_ERRORS[githubError]) return GITHUB_INSTALL_ERRORS[githubError];
    if (oauthError === "access_denied") return "Provider consent was refused, so the account was not linked.";
    if (oauthError === "unable_to_link_account") return "That account could not be linked. Its email may be missing or unverified.";
    if (oauthError) return "The account link did not complete.";
    return "";
}
