// ==========================================
// SUPABASE CONFIGURATION
// ==========================================

const SUPABASE_URL = "https://epedptuewukgferdpzjq.supabase.co";

const SUPABASE_ANON_KEY = "sb_publishable_PpDvDuEQDqNirED5FNEZsA_p7wHVl8s";


// ==========================================
// CREATE SUPABASE CLIENT
// ==========================================

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);


// ==========================================
// PAGE LOAD
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

    console.log("Opportunity Details JS loaded");

    loadOpportunity();

});


// ==========================================
// LOAD SELECTED OPPORTUNITY
// ==========================================

async function loadOpportunity() {

    // Get selected job ID
    const jobId =
        localStorage.getItem("selectedJobId");


    // Check if job ID exists
    if (!jobId) {

        console.error("No job ID found.");

        showError(
            "No opportunity was selected."
        );

        return;
    }


    console.log(
        "Selected Job ID:",
        jobId
    );


    // Get job from Supabase
    const { data: job, error } =
        await supabaseClient
            .from("jobs")
            .select("*")
            .eq("id", jobId)
            .single();


    // Check error
    if (error) {

        console.error(
            "Error loading opportunity:",
            error
        );

        showError(
            "Unable to load opportunity."
        );

        return;
    }


    console.log(
        "Opportunity received:",
        job
    );


    // Display job
    displayOpportunity(job);

}


// ==========================================
// DISPLAY OPPORTUNITY
// ==========================================

function displayOpportunity(job) {

    // Title
    const title =
        document.querySelector("#job-title");

    if (title) {
        title.textContent =
            job.title || "Untitled Opportunity";
    }


    // Job type
    const jobType =
        document.querySelector("#job-type");

    if (jobType) {
        jobType.textContent =
            job.job_type || "Opportunity";
    }


    // Location
    const location =
        document.querySelector("#job-location");

    if (location) {
        location.textContent =
            job.location || "Not specified";
    }


    // Salary
    const salary =
        document.querySelector("#job-salary");

    if (salary) {
        salary.textContent =
            job.salary || "Not specified";
    }


    // Availability
    const availability =
        document.querySelector("#job-availability");

    if (availability) {
        availability.textContent =
            job.availability || "Not specified";
    }


    // Description
    const description =
        document.querySelector("#job-description");

    if (description) {
        description.textContent =
            job.description ||
            "No description available.";
    }


    // Required Skills
    const skills =
        document.querySelector("#job-skills");

    if (skills) {

        skills.textContent =
            job.required_skills ||
            "No specific skills mentioned.";
    }

}


// ==========================================
// ERROR MESSAGE
// ==========================================

function showError(message) {

    const container =
        document.querySelector(".details-container");

    if (!container) {
        return;
    }


    container.innerHTML = `
        <h2>Unable to load opportunity</h2>
        <p>${message}</p>

        <br>

        <a href="student-dashboard.html">
            ← Back to Dashboard
        </a>
    `;

}
// ==========================================
// APPLY NOW
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

    const applyButton = document.getElementById("applyButton");

    if (!applyButton) {
        console.error("Apply button not found.");
        return;
    }

    applyButton.addEventListener("click", async function () {

        // Get logged-in student
        const { data: { user }, error: authError } =
            await supabaseClient.auth.getUser();

        if (authError || !user) {
            alert("Please login first.");
            return;
        }

        console.log("Logged-in Student ID:", user.id);

        // Get selected job ID
        const jobId = localStorage.getItem("selectedJobId");

        if (!jobId) {
            alert("Job information not found.");
            return;
        }

        console.log("Selected Job ID:", jobId);

        // Insert application
        const { data, error } = await supabaseClient
            .from("applications")
            .insert([
                {
                    job_id: jobId,
                    student_id: user.id,
                    status: "pending"
                }
            ])
            .select();

        if (error) {
            console.error("Application error:", error);
            alert("Application failed: " + error.message);
            return;
        }

        console.log("APPLICATION CREATED:", data);

        alert("Application submitted successfully!");
    });

});