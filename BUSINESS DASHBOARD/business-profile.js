/*
=========================================================
POTential BUSINESS PROFILE
=========================================================
*/

document.addEventListener("DOMContentLoaded", function () {

    const profileForm = document.getElementById("profileForm");
    const loadingBox = document.getElementById("loadingBox");
    const errorBox = document.getElementById("errorBox");
    const profileMessage = document.getElementById("profileMessage");
    const saveBtn = document.getElementById("saveBtn");
    const saveText = document.getElementById("saveText");

    let currentUser = null;
    let currentBusiness = null;
    let supabaseClient = null;

    function showError(text) {
        errorBox.textContent = text;
        errorBox.classList.remove("hidden");
        loadingBox.classList.add("hidden");
        profileForm.classList.add("hidden");
    }

    function showMessage(text, type = "") {
        profileMessage.textContent = text;
        profileMessage.className = "message " + type;
    }

    function updateHeader(name) {
        const businessName = name || "Business";

        document.getElementById("businessNameTop").textContent = businessName;
        document.getElementById("heroBusinessName").textContent = businessName;
        document.getElementById("profileAvatar").textContent =
            businessName.charAt(0).toUpperCase();
    }

    async function loadBusiness() {
        try {

            if (typeof SUPABASE_URL === "undefined" ||
                typeof SUPABASE_ANON_KEY === "undefined") {

                showError("Supabase config nahi mil raha. supabase-config.js check karo.");
                return;
            }

            if (!window.supabase || !window.supabase.createClient) {
                showError("Supabase library load nahi hui.");
                return;
            }

            supabaseClient = window.supabase.createClient(
                SUPABASE_URL,
                SUPABASE_ANON_KEY
            );

            console.log("Supabase Connected");

            const {
                data: { user },
                error: authError
            } = await supabaseClient.auth.getUser();

            if (authError) {
                showError(authError.message);
                return;
            }

            if (!user) {
                window.location.href = "../auth.html";
                return;
            }

            currentUser = user;

            const { data: business, error } = await supabaseClient
                .from("businesses")
                .select("id, owner_id, business_name, business_type, city, phone")
                .eq("owner_id", user.id)
                .maybeSingle();

            if (error) {
                showError(error.message);
                return;
            }

            if (!business) {
                showError("Business profile nahi mili.");
                return;
            }

            currentBusiness = business;

            document.getElementById("businessName").value = business.business_name || "";
            document.getElementById("businessType").value = business.business_type || "";
            document.getElementById("city").value = business.city || "";
            document.getElementById("phone").value = business.phone || "";

            updateHeader(business.business_name);

            loadingBox.classList.add("hidden");
            errorBox.classList.add("hidden");
            profileForm.classList.remove("hidden");

        } catch (err) {
            console.error(err);
            showError(err.message);
        }
    }

    profileForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        if (!currentBusiness || !currentUser) {
            showMessage("Business profile load nahi hui.", "error");
            return;
        }

        const business_name = document.getElementById("businessName").value.trim();
        const business_type = document.getElementById("businessType").value.trim();
        const city = document.getElementById("city").value.trim();
        const phone = document.getElementById("phone").value.trim();

        if (!business_name) {
            showMessage("Business Name required hai.", "error");
            return;
        }

        saveBtn.disabled = true;
        saveText.textContent = "Saving...";

        const { error } = await supabaseClient
            .from("businesses")
            .update({
                business_name,
                business_type,
                city,
                phone
            })
            .eq("owner_id", currentUser.id);

        saveBtn.disabled = false;
        saveText.textContent = "Save Changes";

        if (error) {
            showMessage(error.message, "error");
            return;
        }

        currentBusiness.business_name = business_name;
        currentBusiness.business_type = business_type;
        currentBusiness.city = city;
        currentBusiness.phone = phone;

        updateHeader(business_name);

        showMessage("✓ Changes successfully save ho gaye!", "success");
    });

    document.getElementById("logoutBtn").addEventListener("click", async function () {

        if (supabaseClient) {
            await supabaseClient.auth.signOut();
        }

        window.location.href = "../auth.html";
    });

    loadBusiness();
});