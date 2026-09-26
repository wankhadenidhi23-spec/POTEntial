/*
  POTential - Business Frontend
  SUPABASE READS:
    businesses -> current business using owner_id = authenticated user id
    jobs       -> opportunities using business_id = current business id

  SUPABASE WRITES:
    jobs       -> insert a new opportunity

  IMPORTANT:
  This file uses ONLY the tables/columns already visible in the code supplied
  for this project. It does not create or rename database tables.
*/

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

let currentUser = null;
let currentBusiness = null;

const $ = (id) => document.getElementById(id);

function showMessage(text, type = "") {
  const el = $("message");
  el.textContent = text;
  el.className = "message " + type;
}

async function loadBusiness() {
  const { data: { user }, error: userError } =
    await supabaseClient.auth.getUser();

  if (userError || !user) {
    window.location.href = "auth.html";
    return false;
  }

  currentUser = user;

  // SUPABASE READ: businesses
  const { data: business, error } = await supabaseClient
    .from("businesses")
    .select("*")
    .eq("owner_id", user.id)
    .single();

  if (error || !business) {
    console.error("Business read error:", error);
    showMessage("Business profile not found.", "error");
    return false;
  }

  currentBusiness = business;

  $("businessNameTop").textContent = business.business_name || "Business";
  $("businessName").textContent = business.business_name || "Not provided";
  $("businessType").textContent = business.business_type || "Not provided";
  $("businessCity").textContent = business.city || "Not provided";
  $("businessPhone").textContent = business.phone || "Not provided";

  $("welcomeText").textContent =
    `Welcome, ${business.business_name || "Business"}! Manage your opportunities here.`;

  return true;
}

async function postOpportunity(event) {
  event.preventDefault();

  if (!currentBusiness) {
    showMessage("Business information not found.", "error");
    return;
  }

  const title = $("title").value.trim();
  const description = $("description").value.trim();
  const location = $("location").value.trim();
  const jobType = $("jobType").value;
  const skills = $("skills").value.trim();
  const salaryValue = $("salary").value;
  const availability = $("availability").value.trim();
  const deadline = $("deadline").value;

  if (!title || !description || !jobType || !skills || !deadline) {
    showMessage("Please fill all required fields.", "error");
    return;
  }

  $("postBtn").disabled = true;
  $("postBtn").textContent = "Posting...";
  showMessage("Posting opportunity...");

  /*
    SUPABASE WRITE: jobs

    These are the fields already used by your supplied dashboard code.
    location is included below only if your existing jobs table already
    contains a location column. If your agreed schema does NOT have it,
    remove the location line before running.
  */
  const jobData = {
    business_id: currentBusiness.id,
    title,
    description,
    required_skills: skills,
    job_type: jobType,
    salary: salaryValue ? Number(salaryValue) : null,
    availability,
    status: "open",
    deadline: deadline || null
  };

  // Do NOT invent a database column.
  // Uncomment ONLY if your existing jobs table already has `location`.
  // jobData.location = location;

  const { error } = await supabaseClient
    .from("jobs")
    .insert(jobData);

  if (error) {
    console.error("Job insert error:", error);
    showMessage("Could not post opportunity: " + error.message, "error");
    $("postBtn").disabled = false;
    $("postBtn").textContent = "Post Opportunity";
    return;
  }

  $("opportunityForm").reset();
  showMessage("Opportunity posted successfully!", "success");

  $("postBtn").disabled = false;
  $("postBtn").textContent = "Post Opportunity";

  await loadMyJobs();
}

async function loadMyJobs() {
  if (!currentBusiness) return;

  const container = $("jobsContainer");
  container.innerHTML = '<p class="loading">Loading opportunities...</p>';

  // SUPABASE READ: jobs
  const { data: jobs, error } = await supabaseClient
    .from("jobs")
    .select("*")
    .eq("business_id", currentBusiness.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Jobs read error:", error);
    container.innerHTML = "<p>Unable to load opportunities.</p>";
    return;
  }

  if (!jobs || jobs.length === 0) {
    container.innerHTML = "<p>No opportunities posted yet.</p>";
    return;
  }

  container.innerHTML = "";

  jobs.forEach((job) => {
    const card = document.createElement("div");
    card.className = "job-card";

    const status = job.status || "open";
    const salary = job.salary !== null && job.salary !== undefined
      ? "₹" + job.salary
      : "Not specified";

    card.innerHTML = `
      <h3>${escapeHtml(job.title || "Untitled Opportunity")}</h3>
      <p>${escapeHtml(job.description || "No description")}</p>
      <div class="job-details">
        <span>💼 ${escapeHtml(job.job_type || "Not specified")}</span>
        <span>💰 ${escapeHtml(salary)}</span>
        <span>👥 ${escapeHtml(job.availability || "Not specified")}</span>
        <span>📅 Deadline: ${escapeHtml(job.deadline || "Not specified")}</span>
        <span class="status-${escapeHtml(status)}">Status: ${escapeHtml(status)}</span>
      </div>
    `;

    container.appendChild(card);
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

$("opportunityForm").addEventListener("submit", postOpportunity);
$("refreshJobs").addEventListener("click", loadMyJobs);

$("logoutBtn").addEventListener("click", async () => {
  const { error } = await supabaseClient.auth.signOut();

  if (error) {
    console.error("Logout error:", error);
    return;
  }

  window.location.href = "auth.html";
});

async function startDashboard() {

  const loaded = await loadBusiness();

  if (!loaded) return;

  await loadMyJobs();

  await loadApplicants();
}
}
async function loadApplicants() {
  const container = $("applicantsContainer");

  if (!container) return;

  container.innerHTML =
    '<p class="loading">Loading applicants...</p>';

  if (!currentBusiness) {
    container.innerHTML =
      "<p>Business information not found.</p>";
    return;
  }

  try {

    // Get jobs posted by the current business
    const { data: jobs, error: jobsError } =
      await supabaseClient
        .from("jobs")
        .select("id, title")
        .eq("business_id", currentBusiness.id);

    if (jobsError) {
      console.error("Jobs error:", jobsError);
      container.innerHTML =
        "<p>Unable to load your opportunities.</p>";
      return;
    }

    if (!jobs || jobs.length === 0) {
      container.innerHTML =
        "<p>No opportunities posted yet.</p>";
      return;
    }

    const jobIds = jobs.map(job => job.id);

    /*
      APPLICATIONS TABLE

      IMPORTANT:
      Change these column names ONLY if your
      applications table uses different names.
    */

    const { data: applications, error: applicationsError } =
      await supabaseClient
        .from("applications")
        .select("*")
        .in("job_id", jobIds)
        .order("created_at", { ascending: false });

    if (applicationsError) {
      console.error(
        "Applications error:",
        applicationsError
      );

      container.innerHTML =
        "<p>Unable to load applicants.</p>";

      return;
    }

    if (!applications || applications.length === 0) {
      container.innerHTML =
        "<p>No students have applied yet.</p>";
      return;
    }

    container.innerHTML = "";

    applications.forEach(application => {

      const job = jobs.find(
        j => j.id === application.job_id
      );

      const card = document.createElement("div");

      card.className = "applicant-card";

      card.innerHTML = `
        <div class="applicant-info">

          <h3>
            ${escapeHtml(
              application.student_name || "Student"
            )}
          </h3>

          <p>
            <strong>Opportunity:</strong>
            ${escapeHtml(
              job ? job.title : "Unknown Opportunity"
            )}
          </p>

          <p>
            <strong>Email:</strong>
            ${escapeHtml(
              application.student_email || "Not available"
            )}
          </p>

          <p>
            <strong>Applied On:</strong>
            ${
              application.created_at
                ? new Date(
                    application.created_at
                  ).toLocaleDateString()
                : "Not available"
            }
          </p>

          <p>
            <strong>Status:</strong>
            ${escapeHtml(
              application.status || "Pending"
            )}
          </p>

        </div>
      `;

      container.appendChild(card);
    });

  } catch (error) {

    console.error("Applicant loading error:", error);

    container.innerHTML =
      "<p>Something went wrong while loading applicants.</p>";
  }
  $("refreshApplicants").addEventListener(
  "click",
  loadApplicants
);
}

startDashboard();
