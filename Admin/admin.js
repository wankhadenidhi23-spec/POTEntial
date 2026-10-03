import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

// =====================================================
// SUPABASE CONFIG
// =====================================================
const SUPABASE_URL = "https://epedptuewukgferdpzjq.supabase.co";

const SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwZWRwdHVld3VrZ2ZlcmRwempxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkyODM2MTUsImV4cCI6MjEwNDg1OTYxNX0.nlxUzsAf9CHFapeWCRAfvzC0wqQtPnM3Z1Hd6FhTyRg";

const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);


// =====================================================
// ELEMENTS
// =====================================================
const loginScreen = document.getElementById("loginScreen");
const appRoot = document.getElementById("appRoot");

const loginForm = document.getElementById("loginForm");
const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");
const loginError = document.getElementById("loginError");

const logoutBtn = document.getElementById("logoutBtn");
const refreshBtn = document.getElementById("refreshBtn");


// =====================================================
// SHOW LOGIN
// =====================================================
function showLogin() {
    loginScreen.style.display = "flex";
    appRoot.style.display = "none";
}


// =====================================================
// SHOW ADMIN DASHBOARD
// =====================================================
function showApp() {
    loginScreen.style.display = "none";
    appRoot.style.display = "flex";
}


// =====================================================
// ADMIN CHECK
// =====================================================
async function isAdmin(userId) {

    console.log("Checking Admin UID:", userId);

    const { data, error } = await supabase
        .from("profiles")
        .select('"Id", "user_id", "Role"')
        .eq("user_id", userId)
        .maybeSingle();

    console.log("Admin Profile:", data);
    console.log("Admin Check Error:", error);

    if (error) {
        console.error("Admin check failed:", error);
        return false;
    }

    if (!data) {
        console.log("No profile found.");
        return false;
    }

    const role = String(data.Role || "")
        .trim()
        .toLowerCase();

    console.log("User Role:", role);

    return role === "admin";
}


// =====================================================
// LOGIN
// =====================================================
loginForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    loginError.textContent = "";

    const email = loginEmail.value.trim();
    const password = loginPassword.value;

    const loginBtn = document.getElementById("loginBtn");

    loginBtn.disabled = true;
    loginBtn.textContent = "Logging in...";

    try {

        const { data, error } =
            await supabase.auth.signInWithPassword({
                email: email,
                password: password
            });

        if (error) {
            console.error("Login Error:", error);

            loginError.textContent = error.message;

            loginBtn.disabled = false;
            loginBtn.textContent = "Login";

            return;
        }

        if (!data || !data.user) {

            loginError.textContent =
                "Login failed. User information not found.";

            loginBtn.disabled = false;
            loginBtn.textContent = "Login";

            return;
        }

        console.log("LOGIN USER ID:", data.user.id);

        const admin = await isAdmin(data.user.id);

        console.log("ADMIN CHECK:", admin);

        if (!admin) {

            await supabase.auth.signOut();

            loginError.textContent =
                "Access denied. This account is not an admin.";

            loginBtn.disabled = false;
            loginBtn.textContent = "Login";

            return;
        }

        // ⭐ IMPORTANT
        // ADMIN LOGIN SUCCESS
        showApp();

        // Dashboard load
        await loadDashboard();

    } catch (err) {

        console.error("Unexpected Login Error:", err);

        loginError.textContent =
            "Something went wrong. Please try again.";

    }

    loginBtn.disabled = false;
    loginBtn.textContent = "Login";
});


// =====================================================
// LOGOUT
// =====================================================
logoutBtn.addEventListener("click", async () => {

    await supabase.auth.signOut();

    showLogin();

    loginEmail.value = "";
    loginPassword.value = "";
    loginError.textContent = "";

});


// =====================================================
// NAVIGATION
// =====================================================
document.querySelectorAll(".nav-link").forEach(link => {

    link.addEventListener("click", async (event) => {

        event.preventDefault();

        const sectionName =
            link.getAttribute("data-section");

        document.querySelectorAll(".nav-link")
            .forEach(item => item.classList.remove("active"));

        link.classList.add("active");

        document.querySelectorAll(".section")
            .forEach(section => {
                section.classList.remove("active-section");
            });

        const selectedSection =
            document.getElementById(sectionName);

        if (selectedSection) {
            selectedSection.classList.add("active-section");
        }

        const pageName =
            document.getElementById("pageName");

        if (pageName) {
            pageName.textContent =
                link.textContent
                    .replace(/[📊🏢👨‍🎓💼📄📈⚙️]/g, "")
                    .replace(/\d+/g, "")
                    .trim();
        }

        if (sectionName === "overview") {
            await loadOverview();
        }

        if (sectionName === "businesses") {
            await loadBusinesses();
        }

        if (sectionName === "students") {
            await loadStudents();
        }

        if (sectionName === "opportunities") {
            await loadJobs();
        }

        if (sectionName === "applications") {
            await loadApplications();
        }

        if (sectionName === "analytics") {
            await loadAnalytics();
        }
    });

});


// =====================================================
// REFRESH
// =====================================================
refreshBtn.addEventListener("click", async () => {

    refreshBtn.disabled = true;
    refreshBtn.textContent = "Refreshing...";

    try {
        await loadDashboard();
    } catch (error) {
        console.error(error);
    }

    refreshBtn.disabled = false;
    refreshBtn.textContent = "↻ Refresh";
});


// =====================================================
// DASHBOARD
// =====================================================
async function loadDashboard() {

    console.log("Loading Admin Dashboard...");

    await loadOverview();

    await loadBusinesses();

    await loadStudents();

    await loadJobs();

    await loadApplications();

    await loadAnalytics();

    console.log("Admin Dashboard Loaded.");

}


// =====================================================
// OVERVIEW
// =====================================================
async function loadOverview() {

    try {

        const [
            businesses,
            students,
            jobs,
            applications
        ] = await Promise.all([

            supabase
                .from("profiles")
                .select("*", { count: "exact", head: true })
                .eq("Role", "business"),

            supabase
                .from("profiles")
                .select("*", { count: "exact", head: true })
                .eq("Role", "student"),

            supabase
                .from("jobs")
                .select("*", { count: "exact", head: true }),

            supabase
                .from("applications")
                .select("*", { count: "exact", head: true })
        ]);


        document.getElementById("totalBusinesses").textContent =
            businesses.count ?? 0;

        document.getElementById("totalStudents").textContent =
            students.count ?? 0;

        document.getElementById("totalJobs").textContent =
            jobs.count ?? 0;

        document.getElementById("totalApplications").textContent =
            applications.count ?? 0;


        document.getElementById("businessCount").textContent =
            businesses.count ?? 0;

        document.getElementById("studentCount").textContent =
            students.count ?? 0;

        document.getElementById("jobCount").textContent =
            jobs.count ?? 0;

        document.getElementById("applicationCount").textContent =
            applications.count ?? 0;


        await loadRecentApplications();

    } catch (error) {

        console.error("Overview Error:", error);

    }
}


// =====================================================
// RECENT APPLICATIONS
// =====================================================
async function loadRecentApplications() {

    const tbody =
        document.getElementById("recentApplications");

    if (!tbody) return;

    tbody.innerHTML =
        `<tr><td colspan="4" class="loading">Loading...</td></tr>`;

    const { data, error } = await supabase
        .from("applications")
        .select("id, job_id, student_id, status, applied_at")
        .order("applied_at", { ascending: false })
        .limit(5);

    if (error) {

        console.error("Recent Applications Error:", error);

        tbody.innerHTML =
            `<tr><td colspan="4">Unable to load applications</td></tr>`;

        return;
    }

    if (!data || data.length === 0) {

        tbody.innerHTML =
            `<tr><td colspan="4">No applications found.</td></tr>`;

        return;
    }

    tbody.innerHTML = data.map(app => `

        <tr>
            <td>${escapeHTML(app.student_id || "-")}</td>
            <td>${escapeHTML(app.job_id || "-")}</td>
            <td>${statusHTML(app.status)}</td>
            <td>${formatDate(app.applied_at)}</td>
        </tr>

    `).join("");
}


// =====================================================
// BUSINESSES
// =====================================================
async function loadBusinesses() {

    const tbody =
        document.getElementById("businessTable");

    if (!tbody) return;

    tbody.innerHTML =
        `<tr><td colspan="4" class="loading">Loading...</td></tr>`;

    const { data, error } = await supabase
        .from("profiles")
        .select('"full_name", "Email", "Role", "Created_at"')
        .eq("Role", "business")
        .order("Created_at", { ascending: false });

    if (error) {

        console.error("Businesses Error:", error);

        tbody.innerHTML =
            `<tr><td colspan="4">Unable to load businesses</td></tr>`;

        return;
    }

    if (!data || data.length === 0) {

        tbody.innerHTML =
            `<tr><td colspan="4">No businesses found.</td></tr>`;

        return;
    }

    tbody.innerHTML = data.map(item => `

        <tr>
            <td>${escapeHTML(item.full_name || "-")}</td>
            <td>${escapeHTML(item.Email || "-")}</td>
            <td>${escapeHTML(item.Role || "-")}</td>
            <td>${formatDate(item.Created_at)}</td>
        </tr>

    `).join("");
}


// =====================================================
// STUDENTS
// =====================================================
async function loadStudents() {

    const tbody =
        document.getElementById("studentTable");

    if (!tbody) return;

    tbody.innerHTML =
        `<tr><td colspan="4" class="loading">Loading...</td></tr>`;

    const { data, error } = await supabase
        .from("profiles")
        .select('"full_name", "Email", "Role", "Created_at"')
        .eq("Role", "student")
        .order("Created_at", { ascending: false });

    if (error) {

        console.error("Students Error:", error);

        tbody.innerHTML =
            `<tr><td colspan="4">Unable to load students</td></tr>`;

        return;
    }

    if (!data || data.length === 0) {

        tbody.innerHTML =
            `<tr><td colspan="4">No students found.</td></tr>`;

        return;
    }

    tbody.innerHTML = data.map(item => `

        <tr>
            <td>${escapeHTML(item.full_name || "-")}</td>
            <td>${escapeHTML(item.Email || "-")}</td>
            <td>${escapeHTML(item.Role || "-")}</td>
            <td>${formatDate(item.Created_at)}</td>
        </tr>

    `).join("");
}


// =====================================================
// OPPORTUNITIES / JOBS
// =====================================================
async function loadJobs() {

    const tbody =
        document.getElementById("jobTable");

    if (!tbody) return;

    tbody.innerHTML =
        `<tr><td colspan="5" class="loading">Loading...</td></tr>`;

    const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .order("id", { ascending: false });

    if (error) {

        console.error("Jobs Error:", error);

        tbody.innerHTML =
            `<tr><td colspan="5">Unable to load opportunities</td></tr>`;

        return;
    }

    if (!data || data.length === 0) {

        tbody.innerHTML =
            `<tr><td colspan="5">No opportunities found.</td></tr>`;

        return;
    }

    tbody.innerHTML = data.map(job => `

        <tr>
            <td>${escapeHTML(job.title || "-")}</td>
            <td>${escapeHTML(job.job_type || "-")}</td>
            <td>${escapeHTML(job.salary || "-")}</td>
            <td>${statusHTML(job.status)}</td>
            <td>${formatDate(job.created_at)}</td>
        </tr>

    `).join("");
}


// =====================================================
// APPLICATIONS
// =====================================================
async function loadApplications() {

    const tbody =
        document.getElementById("applicationTable");

    if (!tbody) return;

    tbody.innerHTML =
        `<tr><td colspan="6" class="loading">Loading...</td></tr>`;

    const { data, error } = await supabase
        .from("applications")
        .select("id, job_id, student_id, status, applied_at")
        .order("applied_at", { ascending: false });

    if (error) {

        console.error("Applications Error:", error);

        tbody.innerHTML =
            `<tr><td colspan="6">Unable to load applications</td></tr>`;

        return;
    }

    if (!data || data.length === 0) {

        tbody.innerHTML =
            `<tr><td colspan="6">No applications found.</td></tr>`;

        updateApplicationCounts([]);

        return;
    }

    updateApplicationCounts(data);


    tbody.innerHTML = data.map(app => {

        const status =
            String(app.status || "pending")
                .trim()
                .toLowerCase();


        let action = "";


        if (status === "pending") {

            action = `
                <button
                    class="action-btn approve-btn"
                    data-id="${escapeHTML(app.id)}"
                    data-status="accepted">
                    Approve
                </button>

                <button
                    class="action-btn reject-btn"
                    data-id="${escapeHTML(app.id)}"
                    data-status="rejected">
                    Reject
                </button>
            `;

        } else if (status === "accepted") {

            action =
                `<span class="action-done">Approved</span>`;

        } else if (status === "rejected") {

            action =
                `<span class="action-done">Rejected</span>`;

        } else {

            action = `
                <button
                    class="action-btn approve-btn"
                    data-id="${escapeHTML(app.id)}"
                    data-status="accepted">
                    Approve
                </button>

                <button
                    class="action-btn reject-btn"
                    data-id="${escapeHTML(app.id)}"
                    data-status="rejected">
                    Reject
                </button>
            `;
        }


        return `

            <tr>

                <td>${escapeHTML(app.id || "-")}</td>

                <td>${escapeHTML(app.job_id || "-")}</td>

                <td>${escapeHTML(app.student_id || "-")}</td>

                <td>${statusHTML(app.status)}</td>

                <td>${formatDate(app.applied_at)}</td>

                <td class="action-cell">
                    ${action}
                </td>

            </tr>

        `;

    }).join("");
}


// =====================================================
// APPLICATION COUNTS
// =====================================================
function updateApplicationCounts(data) {

    let pending = 0;
    let accepted = 0;
    let rejected = 0;

    data.forEach(app => {

        const status =
            String(app.status || "")
                .trim()
                .toLowerCase();

        if (status === "pending") {
            pending++;
        }

        if (status === "accepted") {
            accepted++;
        }

        if (status === "rejected") {
            rejected++;
        }

    });


    const pendingElement =
        document.getElementById("pendingApplications");

    const acceptedElement =
        document.getElementById("acceptedApplications");

    const rejectedElement =
        document.getElementById("rejectedApplications");


    if (pendingElement)
        pendingElement.textContent = pending;

    if (acceptedElement)
        acceptedElement.textContent = accepted;

    if (rejectedElement)
        rejectedElement.textContent = rejected;
}


// =====================================================
// APPROVE / REJECT
// =====================================================
document.addEventListener("click", async (event) => {

    const button =
        event.target.closest(".action-btn");

    if (!button) return;

    const applicationId =
        button.dataset.id;

    const newStatus =
        button.dataset.status;

    if (!applicationId || !newStatus) return;


    button.disabled = true;
    button.textContent = "Updating...";


    try {

        const { error } = await supabase
            .from("applications")
            .update({
                status: newStatus
            })
            .eq("id", applicationId);


        if (error) {

            console.error(
                "Application Update Error:",
                error
            );

            alert(
                "Update failed: " +
                error.message
            );

            button.disabled = false;

            button.textContent =
                newStatus === "accepted"
                    ? "Approve"
                    : "Reject";

            return;
        }


        await loadApplications();

        await loadOverview();

    } catch (error) {

        console.error(error);

        alert("Something went wrong.");

        button.disabled = false;
    }

});


// =====================================================
// ANALYTICS
// =====================================================
async function loadAnalytics() {

    const [
        businesses,
        students,
        jobs,
        applications
    ] = await Promise.all([

        supabase
            .from("profiles")
            .select("*", { count: "exact", head: true })
            .eq("Role", "business"),

        supabase
            .from("profiles")
            .select("*", { count: "exact", head: true })
            .eq("Role", "student"),

        supabase
            .from("jobs")
            .select("*", { count: "exact", head: true }),

        supabase
            .from("applications")
            .select("*", { count: "exact", head: true })
    ]);


    document.getElementById("analyticsBusinesses").textContent =
        businesses.count ?? 0;

    document.getElementById("analyticsStudents").textContent =
        students.count ?? 0;

    document.getElementById("analyticsJobs").textContent =
        jobs.count ?? 0;

    document.getElementById("analyticsApplications").textContent =
        applications.count ?? 0;
}


// =====================================================
// HELPERS
// =====================================================
function escapeHTML(value) {

    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function formatDate(date) {

    if (!date) return "-";

    const d = new Date(date);

    if (isNaN(d.getTime())) {
        return "-";
    }

    return d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}


function statusHTML(status) {

    const value =
        String(status || "pending")
            .trim()
            .toLowerCase();

    return `
        <span class="status ${value}">
            ${escapeHTML(status || "Pending")}
        </span>
    `;
}


// =====================================================
// INITIAL LOAD
// =====================================================
async function init() {

    console.log("Admin page starting...");

    // Always start with login
    showLogin();

    // Check if already logged in
    const {
        data: { session }
    } = await supabase.auth.getSession();

    if (session && session.user) {

        console.log(
            "Existing session found:",
            session.user.id
        );

        const admin =
            await isAdmin(session.user.id);

        if (admin) {

            console.log(
                "Existing admin session accepted."
            );

            showApp();

            await loadDashboard();

        } else {

            await supabase.auth.signOut();

            showLogin();
        }
    }
}


// =====================================================
// START
// =====================================================
init();
