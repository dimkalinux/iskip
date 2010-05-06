function $() {
	return document.getElementById(arguments[0]);
}

function showMsg(msg, debug) {
	if (debug) {
		Application.console.log(msg);
	}
}


function getRandomString(length) {
	const kSaltTable = [
  	'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n',
  	'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
  	'1', '2', '3', '4', '5', '6', '7', '8', '9', '0' ];

	var kSaltString = "";
	for (var i = 0; i < length; ++i) {
  		kSaltString += kSaltTable[Math.floor(Math.random() * kSaltTable.length)];
	}

	return kSaltString;
}

function makeurl(spec) {
	return ISKIP_IO_SERVICE.newURI(spec, null, null);
}


function get_xml_value(xml, el_name) {
	return xml.getElementsByTagName(el_name).item(0).firstChild.data;
}


function smart_open_url (url) { !url_already_opened (url, true) && open_url (url); }
function iskipGetLString(aName) { return $("iskip-strings").getString(aName); }
function iskipGetFormattedLString(aName, aStrArray) { return $("iskip-strings").getFormattedString(aName, aStrArray); }


function getMainWindow() {
	var windowManager = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService();
	var windowManagerInterface = windowManager.QueryInterface(Components.interfaces.nsIWindowMediator);
	return windowManagerInterface.getMostRecentWindow("navigator:browser");
}

function open_url(url, postData) {
	var parentWindow = null;
	parentWindow = getMainWindow();

	if (postData === undefined) {
		postData = null;
	}

	switch(parseInt(iSkip.pref.get("openLinksIn"))) {
		case OPEN_LINK_IN_CURRENT_TAB:
			parentWindow.getBrowser().loadURI(url, null, postData, false);
			break;

		case OPEN_LINK_IN_NEW_TAB:
			if (parentWindow.getBrowser().mCurrentBrowser.currentURI.spec == "about:blank") {
				parentWindow.getBrowser().loadURI(url, null, postData, false);
			} else {
				parentWindow.getBrowser().selectedTab = parentWindow.getBrowser().addTab(url, null, null, postData, null, false);
			}
			break;

		case OPEN_LINK_IN_NEW_WINDOW:
			parentWindow.open(url);
			break;

		default:
			break;
	}
}


 /**
   * Returns the number of days in the current month of the date object
   */
function getDaysInMonth(date) {
	var currentDate = new Date(date.getFullYear(), date.getMonth()+1, 0);
    	var startOfYear = new Date(date.getFullYear(), date.getMonth(), 1);

    	return (currentDate.getTime()-startOfYear.getTime())/86400000 +1;
}

function getCurrentDateShort() {
	var d = new Date();
	return (d.getFullYear() +"-" + d.getMonth() +"-" + d.getDate());
}


function url_already_opened(url, select) {
	var tabs = Application.activeWindow.tabs;
  	for (var i = 0, tl = tabs.length; i < tl; i++) {
    	if (tabs[i].uri.spec == url) {
			if (select) {
				tabs[i].focus();
			}
			return true;
		}
	}
	return false;
}


function validateIP(ip) {
	var validIpAddress = /^((25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;
	return validIpAddress.exec(ip);
}

function ipFromString(ipWithin) {
	var regexpString=/\d\d?\d?\.\d\d?\d?\.\d\d?\d?\.\d\d?\d?/,
		myregexp = new RegExp(regexpString),
		match = myregexp.exec(ipWithin);

	if(match == null) {
		return 'error';
	} else {
		return match[0];
	}
}


function iskipError(aE) {
  	if (aE && typeof(aE) == "string") {
      	return showMsg(aE, true);
    }

 	var rv = null;
    	var errMsg="";

    	if (/^TypeError/.test(aE))
    	{
    		dump(aE);
      		return -1;
      	}

    	if (aE && typeof(aE) == "object")
    	{
      		var m, n, r, l, ln, fn = "";
      		try
      		{
        		rv = -aE.result;
        		m  = aE.message;
        		fn = aE.filename;
        		l  = aE.location;
        		ln = l.lineNumber;
      		}
      		catch (e) { }

      		errMsg+="FileName:          "+fn+"\n"           +
              		"Result:            "+rv+"\n"           +
              		"Message:           "+m+"\n"            +
              		"LineNumber:        "+ln+"\n";
    	}

    	errMsg = "\n-----======[ iSkip error ]=====-----\n" + errMsg;
    	errMsg += "-------------------------------------\n";

    	showMsg(errMsg, true);

    	return rv;
}



/**
 * Debug or nor ajax call
 */

var is_ajax_debug = false;

function iAjax() {
	var _xmlhttp,
		_done = false,
		_abort_timeout = null,
		_request_timeout = 10*1000,
		response = null;

	try {
		_xmlhttp = new XMLHttpRequest();
	} catch (e) {
		_xmlhttp = false;
		iskipError(e);
	}

	if (!_xmlhttp) {
		showMsg("Can't create XMLHttpRequest-object", true);
		return null;
	}

	this.sendRequest = function (url, method, data, function_call, response_type) {
		if (!_xmlhttp) {
			return false;
		}

		try {
	    	_done = false;
    		method = method.toUpperCase();

			response_type = (response_type) ? response_type : 'text';

			/** override mime **/
			if (response_type == "xml") {
				_xmlhttp.overrideMimeType('text/xml');
			}

			_xmlhttp.open (method, url, true);
			_xmlhttp.setRequestHeader('User-Agent','iSkip');
			_xmlhttp.setRequestHeader('Cache-Control','no-cache');

			// set priority
			if (_xmlhttp.channel instanceof _iskip.env.Ci.nsISupportsPriority) {
  				_xmlhttp.channel.priority = _iskip.env.Ci.nsISupportsPriority.PRIORITY_HIGHEST;
			}


			if (method.toLowerCase() == "post") {
				_xmlhttp.setRequestHeader('Content-Type','application/x-www-form-urlencoded');
				_xmlhttp.setRequestHeader('Connection','close');
			}

			_xmlhttp.onreadystatechange = function () {
				try {
					var t = this;

					if (t.readyState == 4 && !_done) {
						_done = true;

						if (!t.responseText) {
							showMsg ('Ajax Error: NO ResponseText', is_ajax_debug);
							function_call['onError']();
						} else if (t.status == 200) {
							switch (response_type) {
								case 'xml':
									response = t.responseXML;
									break;

								case 'json':
									response = decodeJSON(t.responseText);
									break;

								default:
									response = t.responseText;
									break;
							}
							function_call['onLoad'](response);
						} else {
							function_call['onError']();
						}
					}
				} catch(e) {
					iskipError(e);
				}
        	};

			// send
      		_xmlhttp.send(data);
		} catch (e) {
			iskipError(e);
			return false;
		}

		return true;
	};

	return this;
}


function decodeJSON(text) {
	try {
		var nativeJSON = _iskip.env.Cc["@mozilla.org/dom/json;1"].createInstance(_iskip.env.Ci.nsIJSON);
        return nativeJSON.decode(text);
  	} catch (e) {
		throw(e);
	}
}


function getMimeType(data, isLocal)
{
	var mimeService = ISKIP_MIME_SERVICE;
	var contentType = null;
	try {
		if (isLocal)
			contentType = mimeService.getTypeFromFile(data);
		else
			contentType = mimeService.getTypeFromURI(data);
	}
	catch(e) { contentType = 'application/octet-stream'; }
	return contentType;
}


function showAlertMessage(icon, title, msg)
{
	try {
		var alert = ISKIP_NOTIFY_SERVICE;
		alert.showAlertNotification (icon, title, msg);
	}
	catch (e) {
		iskipError(e);
		showMsg(msg, true);
	}
}


function iskipAssert(cond, msg) {
	iskipDebug && NS_ASSERT(cond, msg);
}

function iskipAssertFailed(msg) {
	iskipDebug && NS_ASSERT(false, msg);
}

