// ===============================
// POTENTIAL - ADMIN PANEL
// ===============================

// ---------- CONNECTION CHECK ----------
async function checkConnection() {
    const status = document.getElementById("connectionStatus");

    try {
        const { data, error } = await supabaseClient
            .from("businesses")
            .select("id")
            .limit(1);

        if (error) throw error;

        status.textContent = "● Connected";
        status.style.color = "green";

        loadDashboard();

    } catch (error) {
        console.error("Connection error:", error);

        status.textContent = "● Connection Failed";
        status.style.color = "red";
    }
}


// ---------- DASHBOARD ----------
async function loadDashboard() {
    await loadBusinesses();
    await loadJobs();
    await loadApplications();
}


// ===============================
// BUSINESSES
// ===============================

async function loadBusinesses() {

    const list = document.getElementById("businessList");
    const totalElement = document.getElementById("totalBusinesses");
    const pendingElement = document.getElementById("pendingBusinesses");

    list.innerHTML = "Loading businesses...";

    const { data, error } = await supabaseClient
        .from("businesses")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Business error:", error);
        list.innerHTML = "Unable to load businesses.";
        return;
    }

    // Total businesses
    totalElement.textContent = data.length;

    // Pending businesses
    const pending = data.filter(
        item => item.approval_status === "pending"
    );

    pendingElement.textContent = pending.length;

    // No businesses
    if (data.length === 0) {
        list.innerHTML = "<p>No businesses found.</p>";
        return;
    }

    // Display businesses
    list.innerHTML = "";

    data.forEach(item => {

        const businessName =
            item.business_name ||
            item.name ||
            "Unnamed Business";

        const status =
            item.approval_status || "pending";

        const div = document.createElement("div");

        div.className = "business-card";

        div.innerHTML = `
            <div>
                <h3>${businessName}</h3>

                <p>
                    Status:
                    <strong>${status}</strong>
                </p>
            </div>

            ${
                status === "pending"
                ? `
                    <button
                        onclick="approveBusiness('${item.id}')"
                        class="approve-btn">
                        Approve
                    </button>
                  `
                : `
                    <span class="approved-text">
                        ✓ Approved
                    </span>
                  `
            }
        `;

        list.appendChild(div);
    });
}


// ===============================
// APPROVE BUSINESS
// ===============================

async function approveBusiness(id) {

    const confirmApprove = confirm(
        "Are you sure you want to approve this business?"
    );

    if (!confirmApprove) return;

    const { error } = await supabaseClient
        .from("businesses")
        .update({
            approval_status: "approved"
        })
        .eq("id", id);

    if (error) {

        console.error("Approval error:", error);

        alert(
            "Business approval failed.\n\n" +
            error.message
        );

        return;
    }

    alert("Business approved successfully! ✅");

    // Reload businesses
    await loadBusinesses();
}


// ===============================
// JOBS
// ===============================

async function loadJobs() {

    const list = document.getElementById("jobList");
    const totalElement = document.getElementById("totalJobs");

    const { data, error } = await supabaseClient
        .from("jobs")
        .select("*");

    if (error) {

        console.error("Jobs error:", error);

        list.innerHTML = "Unable to load jobs.";

        return;
    }

    totalElement.textContent = data.length;

    list.innerHTML = "";

    if (data.length === 0) {

        list.innerHTML = "<p>No jobs found.</p>";

        return;
    }

    data.forEach(job => {

        const div = document.createElement("div");

        div.className = "job-card";

        div.innerHTML = `
            <h3>${job.title || "Untitled Job"}</h3>

            <p>
                ${job.location || "Location not provided"}
            </p>
        `;

        list.appendChild(div);
    });
}


// ===============================
// APPLICATIONS
// ===============================

async function loadApplications() {

    const list = document.getElementById("applicationList");
    const totalElement = document.getElementById("totalApplications");

    const { data, error } = await supabaseClient
        .from("applications")
        .select("*");

    if (error) {

        console.error("Applications error:", error);

        list.innerHTML = "Unable to load applications.";

        return;
    }

    totalElement.textContent = data.length;

    list.innerHTML = "";

    if (data.length === 0) {

        list.innerHTML = "<p>No applications found.</p>";

        return;
    }

    data.forEach(application => {

        const div = document.createElement("div");

        div.className = "application-card";

        div.innerHTML = `
            <p>
                Student ID:
                ${application.student_id || "N/A"}
            </p>

            <p>
                Status:
                <strong>
                    ${application.status || "Pending"}
                </strong>
            </p>
        `;

        list.appendChild(div);
    });
}


// ===============================
// LOGOUT
// ===============================

async function logoutAdmin() {

    const { error } = await supabaseClient.auth.signOut();

    if (error) {

        console.error("Logout error:", error);

        alert("Logout failed.");

        return;
    }

    window.location.href = "../auth.html";
}


// ===============================
// LOGOUT BUTTON
// ===============================

document.addEventListener("DOMContentLoaded", () => {

    const logoutBtn = document.getElementById("logoutBtn");

    if (logoutBtn) {
        logoutBtn.addEventListener(
            "click",
            logoutAdmin
        );
    }

    checkConnection();
});