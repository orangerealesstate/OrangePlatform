const params =
    new URLSearchParams(
        window.location.search
    );


const postId =
    params.get("id");


const tg =
    window.Telegram?.WebApp;


if (tg) {

    tg.ready();

    tg.expand();

}


/* =========================================================
   INPUTS
========================================================= */

const districtInput =
    document.getElementById(
        "district"
    );


const streetInput =
    document.getElementById(
        "street"
    );


const roomsInput =
    document.getElementById(
        "rooms"
    );


const bedroomsInput =
    document.getElementById(
        "bedrooms"
    );


const areaInput =
    document.getElementById(
        "area"
    );


const floorInput =
    document.getElementById(
        "floor"
    );


const priceInput =
    document.getElementById(
        "price"
    );


const descriptionInput =
    document.getElementById(
        "description"
    );


const saveBtn =
    document.getElementById(
        "saveBtn"
    );


const cancelBtn =
    document.getElementById(
        "cancelBtn"
    );


const closeBtn =
    document.getElementById(
        "closeBtn"
    );


const statusBox =
    document.getElementById(
        "status"
    );


/* =========================================================
   STATUS
========================================================= */

function showStatus(
    message,
    type = "error"
) {

    statusBox.textContent =
        message;

    statusBox.className =
        `status ${type}`;

}


/* =========================================================
   BACK
========================================================= */

function goBack() {

    if (postId) {

        window.location.href =
            `details.html?id=${encodeURIComponent(
                postId
            )}&t=${Date.now()}`;

    } else {

        window.location.href =
            "/";

    }

}


/* =========================================================
   LOAD POST
========================================================= */

async function loadPost() {

    if (!postId) {

        showStatus(
            "❌ Не указан ID объявления."
        );

        return;

    }


    try {

        const response =
            await fetch(
                `/api/post/${encodeURIComponent(
                    postId
                )}?t=${Date.now()}`,
                {
                    cache: "no-store"
                }
            );


        if (!response.ok) {

            throw new Error(
                "Не удалось загрузить объявление"
            );

        }


        const post =
            await response.json();


        /* =================================================
           FILL FORM
        ================================================= */

        districtInput.value =
            post.district ?? "";


        streetInput.value =
            post.street ?? "";


        roomsInput.value =
            post.rooms ?? "";


        bedroomsInput.value =
            post.bedrooms ?? "";


        areaInput.value =
            post.area ?? "";


        floorInput.value =
            post.floor ?? "";


        priceInput.value =
            post.price ?? "";


        descriptionInput.value =
            post.text ?? "";


    }

    catch (error) {

        console.error(
            "EDIT LOAD ERROR:",
            error
        );


        showStatus(
            "❌ Не удалось загрузить данные объявления."
        );

    }

}


/* =========================================================
   SAVE
========================================================= */

saveBtn.addEventListener(
    "click",
    async () => {


        const userId =
            tg?.initDataUnsafe?.user?.id;


        if (!userId) {

            showStatus(
                "❌ Откройте редактирование внутри Telegram."
            );

            return;

        }


        if (!postId) {

            showStatus(
                "❌ Не указан ID объявления."
            );

            return;

        }


        /* ================================================
           DATA
        ================================================ */

        const updatedPost = {

            id:
                postId,

            userId:
                String(userId),

            district:
                districtInput.value.trim(),

            street:
                streetInput.value.trim(),

            rooms:
                roomsInput.value.trim(),

            bedrooms:
                bedroomsInput.value.trim(),

            area:
                areaInput.value.trim(),

            floor:
                floorInput.value.trim(),

            price:
                priceInput.value.trim(),

            text:
                descriptionInput.value.trim()

        };


        saveBtn.disabled =
            true;


        saveBtn.textContent =
            "⏳ Сохранение...";


        try {


            const response =
                await fetch(
                    "/api/post/update",
                    {

                        method:
                            "POST",

                        headers: {

                            "Content-Type":
                                "application/json"

                        },

                        body:
                            JSON.stringify(
                                updatedPost
                            )

                    }
                );


            const result =
                await response.json();


            if (
                !response.ok ||
                !result.success
            ) {

                throw new Error(
                    result.error ||
                    "Ошибка сохранения"
                );

            }


            /* ============================================
               SUCCESS
            ============================================ */

            showStatus(
                "✅ Изменения сохранены",
                "success"
            );


            setTimeout(
                () => {

                    goBack();

                },
                500
            );


        }

        catch (error) {

            console.error(
                "EDIT SAVE ERROR:",
                error
            );


            showStatus(
                "❌ Ошибка сохранения: " +
                error.message
            );


            saveBtn.disabled =
                false;


            saveBtn.textContent =
                "💾 Сохранить";

        }

    }
);


/* =========================================================
   CANCEL
========================================================= */

cancelBtn.addEventListener(
    "click",
    goBack
);


/* =========================================================
   CLOSE
========================================================= */

closeBtn.addEventListener(
    "click",
    goBack
);


/* =========================================================
   START
========================================================= */

loadPost();