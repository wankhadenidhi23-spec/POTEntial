/*
=========================================================
POTential BUSINESS PROFILE
=========================================================

EXISTING TABLE:
businesses

EXISTING COLUMNS:
id
owner_id
business_name
business_type
city
phone

READ:
owner_id = logged-in user's ID

UPDATE:
existing business row only

NO NEW TABLE
NO NEW COLUMN
=========================================================
*/


document.addEventListener(
    "DOMContentLoaded",
    function () {


        const profileForm =
            document.getElementById(
                "profileForm"
            );


        const loadingBox =
            document.getElementById(
                "loadingBox"
            );


        const errorBox =
            document.getElementById(
                "errorBox"
            );


        const profileMessage =
            document.getElementById(
                "profileMessage"
            );


        const saveBtn =
            document.getElementById(
                "saveBtn"
            );


        const saveText =
            document.getElementById(
                "saveText"
            );


        let currentUser = null;

        let currentBusiness = null;

        let supabaseClient = null;


        /*
        ==========================================
        SHOW ERROR
        ==========================================
        */

        function showError(text) {

            errorBox.textContent = text;

            errorBox.classList.remove(
                "hidden"
            );

            loadingBox.classList.add(
                "hidden"
            );

            profileForm.classList.add(
                "hidden"
            );
        }


        /*
        ==========================================
        SHOW MESSAGE
        ==========================================
        */

        function showMessage(
            text,
            type
        ) {

            profileMessage.textContent =
                text;

            profileMessage.className =
                "message " + (type || "");
        }


        /*
        ==========================================
        UPDATE HEADER
        ==========================================
        */

        function updateHeader(name) {

            const businessName =
                name || "Business";


            document.getElementById(
                "businessNameTop"
            ).textContent =
                businessName;


            document.getElementById(
                "heroBusinessName"
            ).textContent =
                businessName;


            document.getElementById(
                "profileAvatar"
            ).textContent =
                businessName
                    .charAt(0)
                    .toUpperCase() || "B";
        }


        /*
        ==========================================
        LOAD BUSINESS
        ==========================================
        */

        async function loadBusiness() {

            try {


                /*
                CHECK CONFIG
                */

                if (
                    typeof SUPABASE_URL ===
                    "undefined" ||

                    typeof SUPABASE_ANON_KEY ===
                    "undefined"
                ) {

                    showError(
                        "Supabase config nahi mil raha. " +
                        "supabase-config.js check karo."
                    );

                    return;
                }


                /*
                CHECK SUPABASE LIBRARY
                */

                if (
                    !window.supabase ||
                    !window.supabase.createClient
                ) {

                    showError(
                        "Supabase library load nahi hui."
                    );

                    return;
                }


                /*
                CREATE CLIENT
                */

                supabaseClient =
                    window.supabase.createClient(
                        SUPABASE_URL,
                        SUPABASE_ANON_KEY
                    );


                /*
                GET CURRENT USER
                */

                const {
                    data: { user },
                    error: authError
                } =
                    await supabaseClient
                        .auth
                        .getUser();


                if (authError) {

                    console.error(
                        "Auth error:",
                        authError
                    );

                    showError(
                        "Login session check nahi ho paya: " +
                        authError.message
                    );

                    return;
                }


                /*
                USER LOGIN NAHI HAI
                */

                if (!user) {

                    window.location.href =
                        "auth.html";

                    return;
                }


                currentUser = user;


                /*
                ======================================
                SUPABASE READ
                ======================================

                Existing businesses table se
                current user's business find karo.
                */

                const {
                    data: business,
                    error: businessError
                } =
                    await supabaseClient
                        .from("businesses")
                        .select(
                            "id, owner_id, business_name, business_type, city, phone"
                        )
                        .eq(
                            "owner_id",
                            user.id
                        )
                        .maybeSingle();


                /*
                READ ERROR
                */

                if (businessError) {

                    console.error(
                        "Business read error:",
                        businessError
                    );

                    showError(
                        "Supabase se business data read nahi ho raha: " +
                        businessError.message
                    );

                    return;
                }


                /*
                BUSINESS NAHI MILA
                */

                if (!business) {

                    showError(
                        "Is login account ke liye business profile nahi mili. " +
                        "Supabase businesses table mein owner_id check karo."
                    );

                    return;
                }


                /*
                SAVE BUSINESS LOCALLY
                */

                currentBusiness =
                    business;


                /*
                ======================================
                SUPABASE DATA -> FORM
                ======================================
                */

                document.getElementById(
                    "businessName"
                ).value =
                    business.business_name || "";


                document.getElementById(
                    "businessType"
                ).value =
                    business.business_type || "";


                document.getElementById(
                    "city"
                ).value =
                    business.city || "";


                document.getElementById(
                    "phone"
                ).value =
                    business.phone || "";


                /*
                HEADER
                */

                updateHeader(
                    business.business_name
                );


                /*
                SHOW FORM
                */

                loadingBox.classList.add(
                    "hidden"
                );

                errorBox.classList.add(
                    "hidden"
                );

                profileForm.classList.remove(
                    "hidden"
                );


            } catch (error) {

                console.error(
                    "Profile loading error:",
                    error
                );

                showError(
                    "Profile load karte time error aaya: " +
                    error.message
                );
            }
        }


        /*
        ==========================================
        SAVE CHANGES
        ==========================================
        */

        profileForm.addEventListener(
            "submit",
            async function (event) {


                /*
                IMPORTANT

                Browser ko normal form submit
                karne se rok raha hai.
                */

                event.preventDefault();


                /*
                CHECK BUSINESS
                */

                if (
                    !currentUser ||
                    !currentBusiness
                ) {

                    showMessage(
                        "Business profile abhi load nahi hui.",
                        "error"
                    );

                    return;
                }


                /*
                GET FORM VALUES
                */

                const businessName =
                    document.getElementById(
                        "businessName"
                    )
                    .value
                    .trim();


                const businessType =
                    document.getElementById(
                        "businessType"
                    )
                    .value
                    .trim();


                const city =
                    document.getElementById(
                        "city"
                    )
                    .value
                    .trim();


                const phone =
                    document.getElementById(
                        "phone"
                    )
                    .value
                    .trim();


                /*
                BUSINESS NAME REQUIRED
                */

                if (!businessName) {

                    showMessage(
                        "Business Name required hai.",
                        "error"
                    );

                    return;
                }


                /*
                BUTTON
                */

                saveBtn.disabled =
                    true;

                saveText.textContent =
                    "Saving...";


                showMessage(
                    "Changes save ho rahe hain...",
                    ""
                );


                try {


                    /*
                    ==================================
                    SUPABASE UPDATE
                    ==================================

                    Existing row update hogi.

                    NEW ROW CREATE NAHI HOGI.
                    */

                    const {
                        error: updateError
                    } =
                        await supabaseClient
                            .from("businesses")
                            .update({

                                business_name:
                                    businessName,

                                business_type:
                                    businessType,

                                city:
                                    city,

                                phone:
                                    phone

                            })
                            .eq(
                                "owner_id",
                                currentUser.id
                            );


                    /*
                    UPDATE ERROR
                    */

                    if (updateError) {

                        console.error(
                            "Supabase update error:",
                            updateError
                        );


                        showMessage(
                            "Save nahi hua: " +
                            updateError.message,
                            "error"
                        );


                        saveBtn.disabled =
                            false;

                        saveText.textContent =
                            "Save Changes";

                        return;
                    }


                    /*
                    ==================================
                    UPDATE LOCAL DATA
                    ==================================
                    */

                    currentBusiness.business_name =
                        businessName;


                    currentBusiness.business_type =
                        businessType;


                    currentBusiness.city =
                        city;


                    currentBusiness.phone =
                        phone;


                    updateHeader(
                        businessName
                    );


                    /*
                    SUCCESS
                    */

                    showMessage(
                        "✓ Changes successfully Supabase mein save ho gaye!",
                        "success"
                    );


                    saveBtn.disabled =
                        false;

                    saveText.textContent =
                        "Save Changes";


                } catch (error) {

                    console.error(
                        "Save error:",
                        error
                    );


                    showMessage(
                        "Save failed: " +
                        error.message,
                        "error"
                    );


                    saveBtn.disabled =
                        false;

                    saveText.textContent =
                        "Save Changes";
                }

            }
        );


        /*
        ==========================================
        LOGOUT
        ==========================================
        */

        document
            .getElementById(
                "logoutBtn"
            )
            .addEventListener(
                "click",
                async function () {


                    try {

                        const {
                            error
                        } =
                            await supabaseClient
                                .auth
                                .signOut();


                        if (error) {

                            showMessage(
                                "Logout failed: " +
                                error.message,
                                "error"
                            );

                            return;
                        }


                        window.location.href =
                            "auth.html";


                    } catch (error) {

                        console.error(
                            "Logout error:",
                            error
                        );

                        showMessage(
                            "Logout failed.",
                            "error"
                        );
                    }

                }
            );


        /*
        ==========================================
        START PROFILE
        ==========================================
        */

        loadBusiness();

    }
);