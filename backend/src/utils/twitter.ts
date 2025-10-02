
export type TwitterUser = {
    id: string;
    name: string | null;
    username: string;
    description?: string;
    profile_image_url?: string;
    verified?: boolean;
};

const BASE_URL = "https://api.twitter.com";

function catchTwitterError(error: any) {
    let errorMessage = `Request failed with status ${error.status}`;
    if (
        error.errors &&
        Array.isArray(error.errors) &&
        error.errors[0]?.message
    ) {
        errorMessage = `${error.errors[0].message}`;
    } else if (error.detail) {
        errorMessage = error.detail;
    } else if (error.title) {
        errorMessage = error.title;
    }
    return errorMessage;
}

const getCurrentUser = async (accessToken: string): Promise<TwitterUser> => {
    const res = await fetch(`${BASE_URL}/2/users/me?user.fields=description,profile_image_url,verified`, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(catchTwitterError(error));
    }
    return (await res.json()).data;
};

export default {
    getCurrentUser
};