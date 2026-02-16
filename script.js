const SUPABASE_URL = "https://gdxgrwbodjoxnehbfcgx.supabase.co";
const SUPABASE_KEY = "sb_publishable_ylYu3h9rHlCLt-gmz9cgdQ_LvSoL1JP";
const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let state = { user: null };


// ================================
// LOGGER
// ================================
function logStatus(msg) {
    console.log(msg);
    const el = document.getElementById("auth-msg");
    if (el) el.innerText = msg;
}


// ================================
// CHECK SESSION ON PAGE LOAD
// ================================
window.addEventListener("DOMContentLoaded", async () => {
    const { data } = await db.auth.getSession();
    if (data?.session?.user) {
        state.user = data.session.user;
        await initApp();
    }
});


// ================================
// SIGN UP
// ================================
async function handleSignUp() {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const username = document.getElementById("username").value.trim();

    if (!email || !password || !username) {
        alert("Fill all fields");
        return;
    }

    const btn = document.querySelector("button[onclick='handleSignUp()']");
    btn.innerText = "Creating...";
    btn.disabled = true;

    try {
        const { data, error } = await db.auth.signUp({
            email,
            password,
            options: { data: { username } }
        });

        if (error) throw error;

        // If email confirmation is OFF → session exists immediately
        if (data.session) {
            state.user = data.user;
            await initApp();
        } else {
            // Email confirmation is ON
            logStatus("Account created! Check your email to confirm.");
            btn.innerText = "Create Account";
            btn.disabled = false;
        }

    } catch (err) {
        logStatus("SIGN UP ERROR: " + err.message);
        btn.innerText = "Create Account";
        btn.disabled = false;
    }
}


// ================================
// SIGN IN
// ================================
async function handleSignIn() {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!email || !password) {
        alert("Enter credentials");
        return;
    }

    const btn = document.querySelector("button[onclick='handleSignIn()']");
    btn.innerText = "Signing In...";
    btn.disabled = true;

    try {
        const { data, error } = await db.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;

        state.user = data.user;
        await initApp();

    } catch (err) {
        logStatus("LOGIN ERROR: " + err.message);
        btn.innerText = "Sign In";
        btn.disabled = false;
    }
}


// ================================
// INITIALIZE APP
// ================================
async function initApp() {
    try {
        if (!state.user) return;

        logStatus("Loading profile...");

        // 1️⃣ Check if profile exists
        let { data: profile, error } = await db
            .from("profiles")
            .select("*")
            .eq("id", state.user.id)
            .maybeSingle();

        if (error) throw error;

        // 2️⃣ If profile missing → create it
        if (!profile) {
            const username =
                state.user.user_metadata?.username || "User";

            const avatar =
                `https://api.dicebear.com/9.x/glass/svg?seed=${state.user.id}`;

            const { error: insertError } = await db
                .from("profiles")
                .insert({
                    id: state.user.id,
                    username,
                    avatar_url: avatar
                });

            if (insertError) throw insertError;

            profile = { username, avatar_url: avatar };
        }

        // 3️⃣ Update UI
        document.getElementById("my-username").innerText =
            profile.username;

        document.getElementById("my-avatar").src =
            profile.avatar_url;

        toggleScreen("home-screen");

        logStatus("");

    } catch (err) {
        console.error(err);
        logStatus("INIT ERROR: " + err.message);
    }
}


// ================================
// SCREEN TOGGLER
// ================================
function toggleScreen(screenId) {
    ["auth-screen", "home-screen", "chat-screen", "settings-screen"]
        .forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;
            el.classList.add("hidden");
            el.classList.remove("active-screen");
        });

    const target = document.getElementById(screenId);
    if (target) {
        target.classList.remove("hidden");
        target.classList.add("active-screen");
    }
}


// ================================
// LOGOUT
// ================================
async function handleLogout() {
    await db.auth.signOut();
    window.location.reload();
}


// ================================
// PLACEHOLDERS
// ================================
function loadChats() {}
function openGroupModal() {}
