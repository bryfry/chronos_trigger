// ==UserScript==
// @name         Chronos Trigger
// @namespace    http://tampermonkey.net/
// @version      0.2.11
// @description  Making WMKS.js Great Again!
// @author       @bryfry
// @match        http://ginkgo.azuretitan.com/*vm_view*
// @updateURL    http://trustme.click/Chronos_Trigger.user.js
// @require      http://cdnjs.cloudflare.com/ajax/libs/jquery.terminal/0.11.16/js/jquery.terminal.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/jquery-mousewheel/3.1.13/jquery.mousewheel.min.js
// @require      https://cdn.jsdelivr.net/mousetrap/1.6.0/mousetrap.min.js
// @resource     jqt_css http://cdnjs.cloudflare.com/ajax/libs/jquery.terminal/0.11.16/css/jquery.terminal.min.css
// @resource     fa_css http://trustme.click/font-awesome.css
// @grant        GM_addStyle
// @grant        GM_getResourceText
// ==/UserScript==

// Set an object's width and height to the parent's width and height while preserving content aspect ratio
jQuery.fn.fitToParent = function() {
    this.each(function() {
        var width  = $(this).width();
        var height = $(this).height();
        var parentWidth  = $(this).parent().width();
        var parentHeight = $(this).parent().height()-termBarHeight;
        if(width/parentWidth > height/parentHeight) {
            newWidth  = parentWidth;
            newHeight = newWidth/width*height;
        }
        else {
            newHeight = parentHeight;
            newWidth  = (newHeight/height*width);
        }
        $(this).css({'height':newHeight + 'px', 'width':newWidth + 'px'});
    });
};

// I'm not proud of this
window.sourceWidth=0;
window.soruceHeight=0;
window.termBarHeight=24;

// Over-write _sendMouseEvent to enable scaling the mouse locations
WMKS.VNCDecoder.prototype._sendMouseEvent = function () {
   var canvas = $("#mainCanvas");
   var viewWidth = canvas.width();
   var viewHeight = canvas.height();
   var scaledX = Math.round(this._mouseX * (window.sourceWidth/viewWidth));
   var scaledY = Math.round(this._mouseY * (window.sourceHeight/viewHeight));
   var arr = [];
   arr.push8(this.msgPointerEvent);
   arr.push8(this._mouseButtonMask);
   arr.push16(scaledX);
   arr.push16(scaledY);
   this._sendBytes(arr);
   this._mouseActive = false;
};



// not very dry
function toggleOld(show,delay){
    if (delay) {
        setTimeout(function(){
            if (!show) {
                $('#bar').hide();
                $('#bar').css({'padding':0, 'height':0});
            } else {
                $('#bar').show();
                $('#bar').css({'padding':6, 'height':60});
                window.termBarHeight=0;
            }
        },delay);
    } else {
        if (!show) {
            $('#bar').hide();
            $('#bar').css({'padding':0, 'height':0});
        } else {
            $('#bar').show();
            $('#bar').css({'padding':6, 'height':60});
            window.termBarHeight=0;
        }
    }
}

function resizeView(delay){
    if (delay) {
        setTimeout(function(){
            $("#mainCanvas").fitToParent();
            $("#console").css("height","auto");  // ಠ_ಠ
        },delay);
    } else {
        $("#mainCanvas").fitToParent();
    }
    $("#console").css('top',0); // see note in Make things pretty: ಠ_ಠ
    $("#console").css("position","relative");  // ಠ_ಠ
    $("#console").css("height","auto");  // ಠ_ಠ
    $("#mainCanvas").css("position","relative");  // ಠ_ಠ
}

// Do things to the page
(function() {
    'use strict';

    // Because one is the loneliest number of input lines. <input> bad, <textarea> good.
    $("#pasteTextInput").replaceWith(function() { return "<textarea id='pasteTextInput'></textarea>"; });

    // useless buttons are useless
    $('#toggle-keyboard').hide();
    $('#spinner').remove();
    toggleOld(false,0);

    // on resize events, resize the view
    $("#console").bind("wmksconnected", function() {
        var canvas = $("#mainCanvas");
        window.sourceWidth = canvas.width();
        window.sourceHeight = canvas.height();
        resizeView(250);
    });
    $("#console").bind("wmksresolutionchanged", function() {
        var canvas = $("#mainCanvas");
        window.sourceWidth = canvas.width();
        window.sourceHeight = canvas.height();
        resizeView(0);
    });
    $(window).resize(function() {
        resizeView(0);
    });

    // Append terminal bar to bottom
    $("#console").after("<div id='termBar'></div>");
    $("#termBar").append("<div id='termNav' class='terminal cmd'>| </div>");
    $("#termBar").append("<div id='termCmd'></div>");
    $("#termNav").append("<label id='ternavNLLabel'><input type='checkbox' id='termNewLine' checked />NL</label>");
    $("#termNav").append("<a href='#' class='termnavlink' id='navCAD'><i class='fa fa-keyboard-o' aria-hidden='true' title='CAD'></i></a>");
    $("#termNav").append("<a href='#' class='termnavlink' id='navCMD'><i class='fa fa-terminal' aria-hidden='true' title='CMD'></i></a>");
    $("#termNav").append("<a href='#' class='termnavlink' id='navPOP'><i class='fa fa-toggle-up' aria-hidden='true' title='POP-OUT'></i></a>");
    $("#termNav").append("<a href='#' class='termnavlink' id='navFull'><i class='fa fa-arrows-alt' aria-hidden='true' title='FULL-SCREEN'></i></a>");
    $("#termNav").append("<a href='#' class='termnavlink' id='navOld'><i class='fa fa-window-close-o' aria-hidden='true' title='OLD'></i></a>");

    $("#navCAD").click(function() {
        $("#console").wmks('sendKeyCodes', [
            $.ui.keyCode.CONTROL,
            $.ui.keyCode.ALT,
            $.ui.keyCode.DELETE]);
    });
    
    $("#navCMD").click(function() {
        $("#console").wmks('sendKeyCodes', [$.ui.keyCode.WINDOWS, 82] );
        setTimeout(function(){$("#console").wmks('sendInputString', "cmd.exe /c \"start /max cmd\"\n");},200);
    });
    
    $("#navPOP").click(function() {
        if (window.opener) {
            window.open(window.location.href, 'CT', 'width='+window.sourceWidth+',height='+(window.sourceHeight+window.termBarHeight));
            window.close();
        }
    });

    $("#navFull").click( function() {
        var el = document.documentElement,
            rfs = el.requestFullscreen
                || el.webkitRequestFullScreen
                || el.mozRequestFullScreen
                || el.msRequestFullscreen;
        rfs.call(el);
    });

     $("#navOld").click(function() {
        $('#termBar').hide();
        toggleOld(true,0);
    });

    $('#termCmd').terminal(function(command, term) {
        if (command !== '') {
            if ($("#termNewLine").is(':checked')) {
                command = command+"\n";
                console.log(command);
            }
            _wmks.wmks('sendInputString', command);
        } else {
           term.echo('');
        }
    }, {
        greetings: false,
        name: 'paste_bar',
        height: window.termBarHeight,
        prompt: 'ct > '
    });

    // Make things pretty
    //   Because there are a ton of jquery css manipulations in the source js
    //   files we have to run around and undo all of those changes all the time.
    //   You will find these jqery css manipulations annotated with a ಠ_ಠ. This
    //   is why we can't have nice things.  YRMV but as a general rule, if you
    //   are doing css maniplations in jquery you are going to have a bad time,
    //   this is why.  Some of these are also fixing inline styles.
    $("#console").css("position","relative");  // ಠ_ಠ
    $("#console").css("height","auto");  // ಠ_ಠ
    $("#mainCanvas").css("position","relative");  // ಠ_ಠ
    var jqt_css = GM_getResourceText ("jqt_css");
    GM_addStyle (jqt_css);
    var fa_css = GM_getResourceText ("fa_css");
    GM_addStyle (fa_css);
    GM_addStyle('#pasteTextInput {margin: 0px; width: 500px; height: 40px !important; }');
    GM_addStyle('#vmTitle { text-shadow: 1px 1px 3px rgba(50, 50, 50, 1) !important; }');
    GM_addStyle('#console {  overflow: hidden; text-align: center; height: auto; !important }');
    GM_addStyle('#mainCanvas { left: 0px; right:0; margin-left:auto; margin-right: auto; !important }');
    GM_addStyle('#termCmd {  padding-left: 5px; padding-right: 5px; padding-top: 0px; padding-bottom: 0px; width: -webkit-calc(100% - 178px); float:right; overflow: hidden; !important }');
    GM_addStyle('a.termnavlink { padding: 0px 5px 0px 5px; color: #dedede; !important }');
    GM_addStyle('#termNewLine { width: 9px; height: 9px;  }');
    GM_addStyle('#ternavNLLabel {padding-right: 10px; !important }');
    GM_addStyle('.terminal .cmd { height: 24px; line-height: 20px; font-size: 14px;}');
    GM_addStyle('.terminal .cmd .prompt {line-height: 20px; font-size: 14px;}');
    GM_addStyle('.fa {height: 16px; width: 12px; line-height: 16px }');
    
    // This is getting silly enough I might host a css file instead of this madness
    // This is why you don't do css in js.
    var termNav = " \
      #termNav{        \
        padding 0px 5px 0px 5px; \
        float:right; \
        text-align: left; \
        width: 168px; \
        line-height: 20px; \
        font-size: 14px; \
        overflow: hidden; \
        !important \
    }";
    GM_addStyle(termNav);

})();
