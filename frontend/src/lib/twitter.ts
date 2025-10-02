import { storeCodeChallengeAndVerifier } from "./cookieStore";
import { X_CLIENT_ID, X_REDIRECT_URI } from "./env";
import { pkce } from "./pkce";

export async function authorizeTwitterUserRedirect(state: string) {
    const rootUrl = "https://x.com/i/oauth2/authorize";
    const code_verifier = pkce.generateCodeVerifier();
    const code_challenge = await pkce.generateChallengeFromVerifier(
        code_verifier
    );
    const options = {
        redirect_uri: X_REDIRECT_URI, // client url cannot be http://localhost:3000/ or http://127.0.0.1:3000/
        client_id: X_CLIENT_ID,
        state,
        response_type: "code",
        code_challenge,
        code_challenge_method: "S256",
        scope: ["like.read", "follows.read", "tweet.read", "users.read"].join(
            " "
        ), // add/remove scopes as needed
    };
    const qs = new URLSearchParams(options).toString();
    const twitterLoginUrl = `${rootUrl}?${qs}`;
    storeCodeChallengeAndVerifier(code_challenge, code_verifier);
    window.location.href = twitterLoginUrl;
}
