function showId2(){
    var idmsg = $("#uId").val();
    if (idmsg != ""){
        $("#idmsg").show();
        $("#idmsg").html("<font color='#ff0000'>" + idmsg + "</font>" + "<br>")
    }else{
        $("#idmsg").hide();

    }
}

function showId(){
    var idmsg = document.getElementById("uId").value;
    if(idmsg !=""){
        // 有資料就修改display的值為inline或block，讓其顯現出來
        document.getElementById("idmsg").style.display = "inline";

        // innerHTML可加入Html語法，innerTXT則為純文字
        document.getElementById("idmsg").innerHTML = "<font color='#ff0000'>" + idmsg + "</font>" + "<br>";

    }else{
        // 如無資料則將其隱藏
        document.getElementById("idmsg").style.display = "none";
    }


}