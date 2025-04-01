(function(){

    //選單一定要有以下
    /*
            <div class="">
                <span class="h4 text-success d-none" id="s02_username_showtext">會員: <span class="h3 text-danger"
                        id="s02_username_text">XXX</span>
                </span>

                <button class="btn btn-warning d-none" data-bs-toggle="modal" data-bs-target="#loginModal"
                    id="s02_logout_btn">登出</button>

            </div>
    */
    
    if(!getCookie("Uid01")){
        Swal.fire({
            title: "請先登入會員",
            showDenyButton: false,
            showCancelButton: false,
            confirmButtonText: "確認",
            allowOutsideClick: false,
            denyButtonText: `Don't save`
        }).then((result) => {
            if (result.isConfirmed) {
                location.href = "StickyCalc_index.html";
            }
        });
    }


    var JSONdata = {};
    JSONdata["uid01"] = getCookie("Uid01");
    
    $.ajax({
        type: "POST",
        url: "member_control_api_v1.php?action=checkuid",
        data: JSON.stringify(JSONdata),
        dataType: "json",
        success: function(data){
            $("#username_showtext").removeClass("d-none");
            console.log(data)
            
                // $("#username_text").text(data.data.Username);
                $("#logout_btn").removeClass("d-none");
                $("#backstage").removeClass("d-none");
                $("#map_btn").removeClass("d-none");
                // 渲染帳號資料
                $.ajax({
                    type: "GET",
                    url: "member_control_api_v1.php?action=getalldata",
                    dataType: "json",
                    async: false,
                    success: function(){
                        
                    },
                    error: function () {
                        alert(); //練習階段，一切皆用sweetalert
                    }
                });
        },
        error: function () {
            Swal.fire({
                title: "API串接錯誤",
                text: "member_register_api_v1.php",
                icon: "error"
            });
        }
    })

       // 登出按鈕
       $("#s02_logout_btn").click(function () {
        setCookie("Uid01", "", 7);
        location.href = "SPA-index.html";
        console.log("登出")
        });

        function setCookie(cname, cvalue, exdays) {
            const d = new Date();
            d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
            let expires = "expires=" + d.toUTCString();
            document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
        }

        function getCookie(cname) {
            let name = cname + "=";
            let ca = document.cookie.split(';');
            for (let i = 0; i < ca.length; i++) {
                let c = ca[i];
                while (c.charAt(0) == ' ') {
                    c = c.substring(1);
                }
                if (c.indexOf(name) == 0) {
                    return c.substring(name.length, c.length);
                }
            }
            return "";
        }
}) ();