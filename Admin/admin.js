import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

// =====================================================
// SUPABASE CONFIG
// =====================================================
const SUPABASE_URL = "https://epedptuewukgferdpzjq.supabase.co";

// apni anon / publishable key yahan daaliye
const SUPABASE_ANON_KEY = "sb_publishable_PpDvDuEQDqNirED5FNEZsA_p7wHVl8s";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// =====================================================
// DOM
// =====================================================
const navLinks = document.querySelectorAll(".nav-link");
const sections = document.querySelectorAll(".section");
const pageName = document.getElementById("pageName");
const refreshBtn = document.getElementById("refreshBtn");
const logoutBtn = document.getElementById("logoutBtn");
const loginScreen = document.getElementById("loginScreen");
const loginForm = document.getElementById("loginForm");
const loginError = document.getElementById("loginError");
const loginBtn = document.getElementById("loginBtn");
const appRoot = document.getElementById("appRoot");

// =====================================================
// AUTH (only admin can enter)
// =====================================================
async function isAdmin(userId) {
    const { data, error } = await supabase
        .from("profiles")
        .select("Role")
        .eq("user_id", userId)
        .maybeSingle();

    if (error) {
        console.error("Admin check error:", error);
        return false;
    }

    return data?.Role === "admin";
}
function showLogin(message = "") {
    appRoot.style.display = "none";
    loginScreen.style.display = "flex";
    loginError.textContent = message;
}

function showApp() {
    loginScreen.style.display = "none";
    appRoot.style.display = "flex";
    loadOverview();
}

loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    loginError.textContent = "";
    loginBtn.disabled = true;
    loginBtn.textContent = "Logging in...";

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        loginError.textContent = "Wrong email or password.";
    } else if (!(await isAdmin(data.user.id))) {
        await supabase.auth.signOut();
        loginError.textContent = "This account is not an admin.";
    } else {
        loginForm.reset();
        showApp();
    }

    loginBtn.disabled = false;
    loginBtn.textContent = "Login";
});

logoutBtn.addEventListener("click", async () => {
    await supabase.auth.signOut();
    showLogin();
});

async function init() {
    const { data } = await supabase.auth.getSession();
    const user = data?.session?.user;

    if (user && (await isAdmin(user.id))) {
        showApp();
    } else {
        showLogin();
    }
}

// =====================================================
// NAVIGATION
// =====================================================
navLinks.forEach(link => {
    link.addEventListener("click", (event) => {
        event.preventDefault();
        const sectionName = link.dataset.section;

        navLinks.forEach(item => item.classList.remove("active"));
        link.classList.add("active");

        sections.forEach(section => section.classList.remove("active-section"));
        const target = document.getElementById(sectionName);
        if (target) target.classList.add("active-section");

        pageName.textContent = sectionName.charAt(0).toUpperCase() + sectionName.slice(1);

        if (sectionName === "businesses") loadBusinesses();
        if (sectionName === "students") loadStudents();
        if (sectionName === "opportunities") loadJobs();
        if (sectionName === "applications") loadApplications();
    });
});

// =====================================================
// HELPERS
// =====================================================
function escapeHTML(value) {
    if (value === null || value === undefined) return "";
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function formatDate(value) {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString("en-IN", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit"
    });
}

function statusHTML(status) {
    const safeStatus = String(status || "pending").toLowerCase();
    return `<span class="status ${escapeHTML(safeStatus)}">${escapeHTML(safeStatus)}</span>`;
}

function messageRow(cols, text) {
    return `<tr><td colspan="${cols}" class="loading">${escapeHTML(text)}</td></tr>`;
}

// =====================================================
// OVERVIEW
// =====================================================
async function loadOverview() {
    try {
        const [businesses, students, jobs, applications] = await Promise.all([
            supabase.from("profiles").select("*", { count: "exact", head: true }).eq("Role", "business"),
            supabase.from("profiles").select("*", { count: "exact", head: true }).eq("Role", "student"),
            supabase.from("jobs").select("*", { count: "exact", head: true }),
            supabase.from("applications").select("*", { count: "exact", head: true })
        ]);

        [["Business", businesses], ["Student", students], ["Job", jobs], ["Application", applications]]
            .forEach(([name, res]) => {
                if (res.error) console.error(name + " count error:", res.error);
            });

        const b = businesses.count || 0;
        const s = students.count || 0;
        const j = jobs.count || 0;
        const a = applications.count || 0;

        const set = (id, v) => { document.getElementById(id).textContent = v; };

        set("totalBusinesses", b); set("totalStudents", s);
        set("totalJobs", j); set("totalApplications", a);

        set("businessCount", b); set("studentCount", s);
        set("jobCount", j); set("applicationCount", a);

        set("analyticsBusinesses", b); set("analyticsStudents", s);
        set("analyticsJobs", j); set("analyticsApplications", a);

        await loadRecentApplications();
    } catch (error) {
        console.error("Overview error:", error);
    }
}

// =====================================================
// RECENT APPLICATIONS
// =====================================================
async function loadRecentApplications() {
    const tbody = document.getElementById("recentApplications");

    const { data, error } = await supabase
        .from("applications")
        .select("id, job_id, student_id, status, applied_at")
        .order("applied_at", { ascending: false })
        .limit(8);

    if (error) {
        console.error("Recent applications error:", error);
        tbody.innerHTML = messageRow(4, "Unable to load applications.");
        return;
    }

    if (!data || data.length === 0) {
        tbody.innerHTML = messageRow(4, "No applications found.");
        return;
    }

    tbody.innerHTML = data.map(app => `
        <tr>
            <td>${escapeHTML(app.student_id)}</td>
            <td>${escapeHTML(app.job_id)}</td>
            <td>${statusHTML(app.status)}</td>
            <td>${formatDate(app.applied_at)}</td>
        </tr>
    `).join("");
}

// =====================================================
// BUSINESSES / STUDENTS
// =====================================================
async function loadProfiles(role, tbodyId, label) {
    const tbody = document.getElementById(tbodyId);
    tbody.innerHTML = messageRow(4, "Loading...");

    const { data, error } = await supabase
        .from("profiles")
        .select("full_name, Email, Role, created_at")
        .eq("Role", role)
        .order("created_at", { ascending: false });

    if (error) {
        console.error(label + " error:", error);
        tbody.innerHTML = messageRow(4, error.message);
        return;
    }

    if (!data || data.length === 0) {
        tbody.innerHTML = messageRow(4, `No ${label} found.`);
        return;
    }

    tbody.innerHTML = data.map(item => `
        <tr>
            <td>${escapeHTML(item.full_name)}</td>
            <td>${escapeHTML(item.Email)}</td>
            <td>${escapeHTML(item.Role)}</td>
            <td>${formatDate(item.created_at)}</td>
        </tr>
    `).join("");
}

const loadBusinesses = () => loadProfiles("business", "businessTable", "businesses");
const loadStudents = () => loadProfiles("student", "studentTable", "students");

// =====================================================
// JOBS / OPPORTUNITIES
// =====================================================
async function loadJobs() {
    const tbody = document.getElementById("jobTable");
    tbody.innerHTML = messageRow(5, "Loading...");

    const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Jobs error:", error);
        tbody.innerHTML = messageRow(5, error.message);
        return;
    }

    if (!data || data.length === 0) {
        tbody.innerHTML = messageRow(5, "No opportunities found.");
        return;
    }

    tbody.innerHTML = data.map(job => `
        <tr>
            <td>${escapeHTML(job.title || job.job_title || "Untitled Opportunity")}</td>
            <td>${escapeHTML(job.type || job.job_type || "-")}</td>
            <td>${escapeHTML(job.salary || job.pay || job.salary_range || "-")}</td>
            <td>${statusHTML(job.status || "open")}</td>
            <td>${formatDate(job.created_at)}</td>
        </tr>
    `).join("");
}

// =====================================================
// APPLICATIONS (with Approve / Reject)
// =====================================================
async function loadApplications() {
    const tbody = document.getElementById("applicationTable");
    tbody.innerHTML = messageRow(6, "Loading...");

    const { data, error } = await supabase
        .from("applications")
        .select("id, job_id, student_id, status, applied_at")
        .order("applied_at", { ascending: false });

    if (error) {
        console.error("Applications error:", error);
        tbody.innerHTML = messageRow(6, error.message);
        return;
    }

    const list = data || [];
    const countOf = (s) => list.filter(a => a.status === s).length;

    document.getElementById("pendingApplications").textContent = countOf("pending");
    document.getElementById("acceptedApplications").textContent = countOf("accepted");
    document.getElementById("rejectedApplications").textContent = countOf("rejected");

    if (list.length === 0) {
        tbody.innerHTML = messageRow(6, "No applications found.");
        return;
    }

    tbody.innerHTML = list.map(app => `
        <tr>
            <td>${escapeHTML(app.id)}</td>
            <td>${escapeHTML(app.job_id)}</td>
            <td>${escapeHTML(app.student_id)}</td>
            <td>${statusHTML(app.status)}</td>
            <td>${formatDate(app.applied_at)}</td>
            <td>
                ${app.status === "accepted" ? "" :
                    `<button class="action-btn approve" data-id="${escapeHTML(app.id)}" data-status="accepted">✔ Approve</button>`}
                ${app.status === "rejected" ? "" :
                    `<button class="action-btn reject" data-id="${escapeHTML(app.id)}" data-status="rejected">✖ Reject</button>`}
            </td>
        </tr>
    `).join("");
}

document.getElementById("applicationTable").addEventListener("click", async (event) => {
    const btn = event.target.closest(".action-btn");
    if (!btn) return;

    btn.disabled = true;

    const { data, error } = await supabase
        .from("applications")
        .update({ status: btn.dataset.status })
        .eq("id", btn.dataset.id)
        .select();

    if (error || !data || data.length === 0) {
        console.error("Update error:", error);
        alert("Could not update. Check the admin RLS policy (UPDATE on applications).");
        btn.disabled = false;
        return;
    }

    await loadApplications();
    await loadOverview();
});

// =====================================================
// REFRESH + START
// =====================================================
refreshBtn.addEventListener("click", async () => {
    refreshBtn.textContent = "↻ Refreshing...";
    await loadOverview();
    refreshBtn.textContent = "↻ Refresh";
});

document.addEventListener("DOMContentLoaded", init);