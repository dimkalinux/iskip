"use strict";

if (typeof iSkip === "undefined" || !iSkip) {
	var iSkip = null;
}

iSkip = function () {
	var observer = null;

	return {
		load: function () {
			iskipDebug = iSkip.pref.get("debug", false);

			// set panel label
			$('iskip_panel').label = iskipGetLString("labelDefault");

			// Don't init iSkip when the window is popup.
			if (window.toolbar.visible === false) {
				var btn = $("iskip_panel");
				var parent = btn.parentNode;
				if (parent && btn) {
					parent.removeChild(btn);
				}
				return;
			}


			iSkip.loading();

			// fix ftp bug
			iSkip.utils.fixFtpbug();

			observer = ISKIP_OBSERVER_SERVICE;

			// add Observer for Update
			observer.addObserver(iSkip, ISKIP_NOTIFY_UPDATE, false);

			// add Observer for change Network status = online/offline
			observer.addObserver(iSkip, ISKIP_OBSERVER_NET_STATUS, false);

			// hide menu
			$("iskip-menu-up").setAttribute("hidden", !iSkip.pref.get("watch_up"));
			$("iskip-menu-cinema").setAttribute("hidden", !iSkip.pref.get("watch_cinema"));
			$("iskip-menu-film").setAttribute("hidden", !iSkip.pref.get("watch_film"));


			if (iSkip.utils.isOffline()) {
				iSkip.errorReport(iskipGetLString("labelErrorOffline"), iskipGetLString("tipErrorOffline"));
			} else {
				setTimeout("iSkip.deferedStartup()", ISKIP_START_TIMEOUT);
			}
		},


		unload: function() {
			if (window.toolbar.visible === false) {
				return;
			}

			// remove all Observer's
			observer.removeObserver(iSkip, ISKIP_NOTIFY_UPDATE);
			observer.removeObserver(iSkip, ISKIP_OBSERVER_NET_STATUS);

			if(!iSkip.pref.get("rememberPassword")) {
				iSkip.pref.setPassword("");
			}

			// forgot SID
			iSkip.pref.set('logged_SID', "");
		},


		// Real start here
		deferedStartup: function() {
			iSkip.checkIsEndOfMonth();

			//
			if (iSkip.utils.isOffline()) {
				iSkip.errorReport(iskipGetLString("labelErrorOffline"), iskipGetLString("tipErrorOffline"));
				return;
			}

			// We online — start update
			iSkip.update();
		},


		checkIsEndOfMonth: function()
		{
			var d = new Date();
			var cMonth = d.getMonth();
			var cDay = d.getDate();
			var num_days_in_month = getDaysInMonth(d);
			var cDate = getCurrentDateShort();

			if (	(iSkip.pref.get("notification.on.end.month")) &&
				(cDay >= (num_days_in_month-1)) &&
				(cDate != iSkip.pref.get("notification.on.end.month.curent.date")))
			{
				var alert = ISKIP_PROMPT_SERVICE;
				var check = {value: false};
				alert.alertCheck(null,
						iskipGetLString("alertDebitLimitHeader"),
						iskipGetLString("alertEndOfMonthText"),
								iskipGetLString("dontShowThisMessage"), check);
						iSkip.pref.set("notification.on.end.month", !check.value);
				iSkip.pref.set("notification.on.end.month.curent.date", cDate);
			}
		},


		checkForDebitLimit: function(debit)
		{
			var debit_limit_for_alert = iSkip.pref.get("alert_info_debit_limit");

			if ((debit_limit_for_alert > 0) &&
				(debit < debit_limit_for_alert) &&
				!iSkip.pref.get("alert_info_debit_active"))
			{
				showAlertMessage(ALERT_ICON_INFO, iskipGetLString("alertDebitLimitHeader"),
							 iskipGetFormattedLString("alertDebitLimitText",
							 [iSkip.pref.get("alert_info_debit_limit")]));
			}

			iSkip.pref.set('alert_info_debit_active', (debit < debit_limit_for_alert));
		},


		observe: function (aSubject, aTopic, aData) {
			if (aTopic == ISKIP_NOTIFY_UPDATE) {
				iSkip.update();
			} else if (aTopic == ISKIP_OBSERVER_NET_STATUS) {
				if (aData == "online") {
					setTimeout("iSkip.update()", 500);
				} else if (aData == "offline") {
					setTimeout(function() {
						iSkip.errorReport(iskipGetLString("labelErrorOffline"),
						iskipGetLString("tipErrorOffline"));
					}, 100);
				}
			}
		},





		update: function () {
			if (iSkip.utils.isOffline()) {
				iskipError("No updates in offline mode");
				iSkip.errorReport(iskipGetLString("labelErrorOffline"), iskipGetLString("tipErrorOffline"));
				return;
			}

			iSkip.loading();

			$("iskip-menu-up").setAttribute("hidden", !iSkip.pref.get("watch_up"));
			$("iskip-menu-cinema").setAttribute("hidden", !iSkip.pref.get("watch_cinema"));
			$("iskip-menu-film").setAttribute("hidden", !iSkip.pref.get("watch_film"));

			// disable separator если нет меню
			$("iskip-menu-new-separator").setAttribute("hidden", (
				$("iskip-menu-up").getAttribute("hidden") ||
				$("iskip-menu-cinema").getAttribute("hidden") ||
				$("iskip-menu-film").getAttribute("hidden")
			));


			iSkip.getUpdates();
		},


		getUpdates: function() {
			var watchDebit = iSkip.pref.get("watch_debit");

			if (watchDebit) {
				if (iSkip.stat.sameAccount(iSkip.stat.getCurrentSID())) {
					iSkip.updater.debit();
				} else {
					iSkip.stat.logout();
					window.setTimeout(function() { iSkip.stat.login(); }, 2*SEC);
				}
			} else {
				$("tip-info").setAttribute("collapsed", "true");
			}

			iSkip.updater.ip();

			if (iSkip.pref.get("watch_up")) {
				iSkip.updater.up();
			}

			if (iSkip.pref.get("watch_film")) {
				iSkip.updater.film();
			}

			if (iSkip.pref.get("watch_cinema")) {
				iSkip.updater.cinema();
			}

			if (iSkip.pref.get("notification.on.badweather")) {
				iSkip.updater.weather();
			}

			if (!watchDebit) {
				$('iskip_panel').label = iskipGetLString("labelDefault");
				iSkip.setTip("iskip_tip_onestring_message", iskipGetLString("startTipText"));
				iSkip.status.set("normal");
			}
		},


		loading: function () {
			iSkip.status.set("busy");
			iSkip.setTip("iskip_tip_onestring_message", iskipGetLString("stateLoading"));
		},



		click: function (event) {
			if (event.button === 0) {
				iSkip.showPrefs();
			}
		},


		showPrefs: function () {
			window.openDialog("chrome://iskip/content/preferences/preferences.xul",
				"_blank", "chrome,centerscreen,modal=yes,resizable=no,toolbar");
			return true;
		},


		cleanTooltip: function () {
			$("iskip_tip_logged_as").value = "";
			$("iskip_tip_username").value="";
			$("iskip_tip_debit").value = "";
			$("iskip_tip_ip").value = "";
			$("iskip_tip_onestring_message").value = "";
		},



		setTip: function (name, value) {
			if (value) {
				$(name).setAttribute("value", value);
				$(name).setAttribute("collapsed", "false");

				if (name == "iskip_tip_logged_as" || name == "iskip_tip_username" || name == "iskip_tip_debit") {
					$("tip-info").setAttribute("collapsed", "false");
				}
				if (name == "iskip_tip_ip") {
					$(name).setAttribute("collapsed", "false");
				}

				// oneString message
				if (name == "iskip_tip_onestring_message") {
					$("tip-message").setAttribute("collapsed", "false");
					$("many-string-message-box").setAttribute("collapsed", "true");
				} else {
					$("tip-message").setAttribute("collapsed", "true");
					$("many-string-message-box").setAttribute("collapsed", "false");
				}
			} else {
				$(name).setAttribute("value", iskipGetLString("labelError"));
				$(name).setAttribute("collapsed", "true");
			}
		},


		cleanMenu: function (menu) {
			while (menu.hasChildNodes()) {
				menu.removeChild(menu.firstChild);
			}
		},


		errorReport: function (label, tip) {
			if(label && tip) {
				$('iskip_panel').label = label;
				iSkip.setTip("iskip_tip_onestring_message", tip);
			}

			iSkip.status.set("error");
		}
	};
}();


iSkip.utils = {
	gtm: function () {
		return (new Date()).getTime();
	},

	fixFtpbug: function () {
		var b = ISKIP_PREF_SERVICE.getBranch("network.standard-url.");
		if (b.getBoolPref("encode-utf8") === true) {
			b.setBoolPref("encode-utf8", false);
		}
	},

	isOffline: function () {
		return !navigator.onLine;
	},

	makeUrl: function (url) {
		return url += (/\?/.test(url) ? "&":"?") + "ts=" + iSkip.utils.gtm();
	}
};

iSkip.updater = function () {
	// private
	var timer_up = null,
		timer_ip = null,
		timer_film = null,
		timer_cinema = null,
		timer_weather = null,
		timer_debit = null;


	// public functions
	return {
		up: function () {
			window.clearTimeout(timer_up);
			showMsg("Ajax start update_up", iskipDebug);

			var ajax = new iAjax(),
				url = iSkip.utils.makeUrl(ISKIP_WATCH_UP_URL);

			var function_call = {
				'onLoad': function (response) {
					// clean menu
					$("iskip-menu-up").setAttribute("disabled", true);
					iSkip.cleanMenu ($("last_10_from_up_menupopup"));

					try {
						var items = response.getElementsByTagName("item");
						for each (var item in items) {
							if (item && item.nodeName == 'item') {
								var menuitem = document.createElement("menuitem");
								menuitem.setAttribute("label", item.getAttribute("name"));
								menuitem.setAttribute("oncommand", "smart_open_url('http://up.lluga.net/" +item.getAttribute("id") +"')");
								$("last_10_from_up_menupopup").appendChild(menuitem);
							}
						}
					} catch (e) {
						iskipError(e);
					}
					$("iskip-menu-up").setAttribute("disabled", false);
				},

				'onError': function () {
					iskipError("iSkip error: updateUP");
				}
			};

			ajax.sendRequest(url, "get", "null", function_call, "xml");
			timer_up = window.setTimeout("iSkip.updater.up()", INTERVAL_UPDATE_UP);
		},


		weather: function () {
			window.clearTimeout(timer_weather);
			showMsg("Start updateWeather", iskipDebug);

			// already notified ?
			if (getCurrentDateShort() == iSkip.pref.get('notification.on.badweather.curent.date')) {
				timer_weather = window.setTimeout("iSkip.updater.weather()", INTERVAL_UPDATE_WEATHER);
				return;
			}

			var	ajax = new iAjax(),
				luganks_id = "34523",
				url = iSkip.utils.makeUrl(ISKIP_WATCH_WEATHER_URL + (luganks_id == "" ? "" : "?city=" + luganks_id));

			var function_call = {
				'onLoad': function (response) {
					try	{
						var weather_type = get_xml_value (response, 'weather_type');
						if (weather_type.indexOf('гроза', 0) != -1) {
							var alert = ISKIP_PROMPT_SERVICE,
								check = {value: false};

							alert.alertCheck(null,
								iskipGetLString("alertWeatherHeader"),
								iskipGetLString("alertWeatherText"),
								iskipGetLString("alertWeatherDisable"), check);

							iSkip.pref.set("notification.on.badweather.curent.date", getCurrentDateShort());
							iSkip.pref.set("notification.on.badweather", !check.value);
						}
					} catch (e) {
						iskipError(e);
					}
				},
				'onError': function () {
					iskipError("iSkip error: updateWeather");
				}
			};

			ajax.sendRequest(url, "get", "null", function_call, "xml");
			timer_weather = window.setTimeout("iSkip.updater.weather()", INTERVAL_UPDATE_WEATHER);

		},


		debit: function () {
			window.clearTimeout(timer_debit);
			showMsg("start updateDebit", iskipDebug);

       		var ajax = new iAjax(),
				url = iSkip.utils.makeUrl(ISKIP_WATCH_DEBIT_URL);

			var function_call = {
	    		'onLoad': function (response) {
					var login = get_xml_value(response, 'login'),
        				debit = get_xml_value(response, 'debit'),
        				label = debit;

					iSkip.checkForDebitLimit(debit);

					iSkip.setTip("iskip_tip_logged_as", iskipGetLString("tipWorkingName"));
					iSkip.setTip("iskip_tip_username", " "+login);
					iSkip.setTip("iskip_tip_debit", iskipGetFormattedLString("tipWorkingDebit", [debit]));
					$('iskip_panel').label = label;
	        		iSkip.status.set("normal");
	        	},
				'onError': function () {
					iSkip.errorReport(iskipGetLString("labelError"), iskipGetLString("tipAjaxError"));
					iskipError("iSkip error: updateDebit");
				}
			};

			ajax.sendRequest(url, "get", "null", function_call, "xml");
			timer_debit = window.setTimeout("iSkip.updater.debit()", INTERVAL_UPDATE_DEBIT);
		},


		cinema: function () {
			window.clearTimeout(timer_cinema);

	       	var	ajax = new iAjax(),
				url = iSkip.utils.makeUrl(ISKIP_WATCH_CINEMA_URL);

	        var function_call = {
	        	'onLoad': function (response) {
					// clean menu
					$("iskip-menu-cinema").setAttribute("disabled", true);
					iSkip.cleanMenu ($("last_10_from_cinema_menupopup"));

					try {
						var items = response.getElementsByTagName("item");
						for each (var item in items) {
							if (item && item.nodeName == 'item') {
								var menuitem = document.createElement("menuitem");
								menuitem.setAttribute("label", get_xml_value(item, "title"));
								menuitem.setAttribute("oncommand", "smart_open_url('"+get_xml_value(item, "link")+"')");
								$("last_10_from_cinema_menupopup").appendChild(menuitem);
							}
						}
					} catch (e) {
						iskipError(e);
					}
					$("iskip-menu-cinema").setAttribute("disabled", false);
	        	},
				'onError': function () {
					iskipError ("iSkip error: updateCinema");
				}
			};

			ajax.sendRequest(url, "get", "null", function_call, "xml");
			timer_cinema = window.setTimeout("iSkip.updater.cinema()", INTERVAL_UPDATE_CINEMA);
		},

		film: function () {
			window.clearTimeout(timer_film);

	       	var	ajax = new iAjax(),
				url = iSkip.utils.makeUrl(ISKIP_WATCH_FILM_URL);

	        var function_call = {
	        	'onLoad': function (response) {
					// clean menu
					$("iskip-menu-film").setAttribute("disabled", true);
					iSkip.cleanMenu($("last_10_from_film_menupopup"));

					try {
						var items = response.getElementsByTagName("item");
						for each (var item in items) {
							if (item && item.nodeName == 'item') {
								var menuitem = document.createElement("menuitem");
								menuitem.setAttribute("label", get_xml_value(item, "title"));
								menuitem.setAttribute("oncommand", "smart_open_url('"+get_xml_value(item, "link")+"')");
								$("last_10_from_film_menupopup").appendChild(menuitem);
							}
						}
					} catch (e) {
						iskipError(e);
					}
					$("iskip-menu-film").setAttribute("disabled", false);
	        	},
				'onError': function () {
					iskipError ("iSkip error: updateFilm");
				}
			};

			ajax.sendRequest(url, "get", "null", function_call, "xml");
			timer_cinema = window.setTimeout("iSkip.updater.film()", INTERVAL_UPDATE_FILM);
		},

		ip: function () {
			window.clearTimeout(timer_ip);
			showMsg("start updateIP", iskipDebug);

			var ajax = new iAjax(),
				url = iSkip.utils.makeUrl(ISKIP_WATCH_IP_URL);

			var function_call = {
				'onLoad': function (response) {
					try {
						var ip = get_xml_value(response, 'ip');
						if (validateIP(ipFromString(ip))) {
							iSkip.setTip("iskip_tip_ip", iskipGetFormattedLString("tipWorkingIP", [ip]));
						}
					} catch (e) {
						iskipError(e);
					}
				},
				'onError': function () {
					iskipError("iSkip error: updateIP");
				}
			};

			ajax.sendRequest(url, "get", "null", function_call, "xml");
			timer_ip = window.setTimeout("iSkip.updater.ip()", INTERVAL_UPDATE_IP);
		}
	};
}();


iSkip.stat = function () {

	return {
		sameAccount: function (SID) {
			return (SID && (SID === iSkip.pref.get('logged_SID')));
		},

		getCurrentSID: function () {
			var cookieManager = ISKIP_COOKIEMANAGER_SERVICE,
				iter = cookieManager.enumerator;

			while (iter.hasMoreElements()) {
				var cookie = iter.getNext();
				if (cookie instanceof Components.interfaces.nsICookie) {
					if ((cookie.host.indexOf(".lluga.net", 0) != -1) && (cookie.path == '/')) {
						if(cookie.name == "lluga_user_sid") {
							return cookie.value;
						}
					}
				}
			}
		},

		logout: function() {
			iSkip.pref.set('logged_SID', "");

			// remove cookies
			var cookieManager = ISKIP_COOKIEMANAGER_SERVICE,
				iter = cookieManager.enumerator;

			while (iter.hasMoreElements()) {
				var cookie = iter.getNext();
				if (cookie instanceof Components.interfaces.nsICookie) {
					if ((cookie.host.indexOf(".lluga.net", 0) != -1) && (cookie.path == '/')) {
						if (cookie.name == 'lluga_user_sid') {
							cookieManager.remove(cookie.host, cookie.name, cookie.path, false);
						}
					}
				}
			}
		},

		login: function () {
			if (iSkip.pref.accountExist()) {
				var ajax = new iAjax();

				var functionCall = {
					'onLoad': function (response) {
						if (response.error === 0) {
							showMsg("Login ok: currentSID is " +iSkip.stat.getCurrentSID(), iskipDebug);
							iSkip.pref.set('logged_SID', iSkip.stat.getCurrentSID());
							iSkip.getUpdates(true);
						} else {
							showMsg("Login failed", iskipDebug);
							iSkip.errorReport(iskipGetLString("labelError"), iskipGetLString("tipLoginFailed"));
						}
					},
					'onError': function () {
						iSkip.errorReport(iskipGetLString("labelError"), iskipGetLString("tipAjaxError"));
					}
				};

				ajax.sendRequest(iSkip.utils.makeUrl(ISKIP_STAT_LOGIN_URL), 'post',
					'username='+encodeURIComponent(iSkip.pref.get('username'))+'&password='+encodeURIComponent(iSkip.pref.getPassword()),
					functionCall, 'json');
			} else {
				iSkip.errorReport(iskipGetLString("needLogin"), iskipGetLString("needLoginTip"));
			}
		}
	};
}();



iSkip.status = {
	set: function (status) {
		$("iskip_panel").setAttribute("status", status);
	},

	get: function () {
		return $("iskip_panel").getAttribute("status");
	}
}


iSkip.pref = function () {
	// private
	var _prefs = null,
		observer = null,
		passwordManager = null,
		nsLoginInfo = null;


	// public functions
	return {
		load: function () {
			observer = ISKIP_OBSERVER_SERVICE;
			_prefs = ISKIP_PREF_SERVICE.getBranch("extensions.iskip.");

			nsLoginInfo = new _iskip.env.CC("@mozilla.org/login-manager/loginInfo;1",Components.interfaces.nsILoginInfo,"init");
			passwordManager = _iskip.env.Cc["@mozilla.org/login-manager;1"].getService(Components.interfaces.nsILoginManager);
		},


		unload: function () {
			iSkip.pref.setPassword($('iskip-password').value);
			observer.notifyObservers(null, ISKIP_NOTIFY_UPDATE, true);
		},


		get: function (prefName, aDefVal) {
			var prefBranch = _prefs;


			if (prefBranch.getPrefType(prefName) == prefBranch.PREF_STRING) {
				try {
						return prefBranch.getCharPref(prefName);
					} catch (e) {
						return aDefVal != undefined ? aDefVal : null;
					}
				return null;
			} else if (prefBranch.getPrefType(prefName) == prefBranch.PREF_INT) {
				try {
						return prefBranch.getIntPref(prefName);
					} catch (e) {
						return aDefVal != undefined ? aDefVal : null;
					}
				return null;
			} else if (prefBranch.getPrefType(prefName) == prefBranch.PREF_BOOL) {
				try {
						return prefBranch.getBoolPref(prefName);
					} catch (e) {
						return aDefVal != undefined ? aDefVal : null;
					}
				return null;
			}

			iskipAssert(false, "iSkip.pref.get unknown preferences type");
		},


		set: function (prefName, value) {
			try {
				var prefBranch = _prefs;

				if (typeof value == "string") {
					prefBranch.setCharPref(prefName, value);
					return;
				} else if (typeof value == "number") {
					prefBranch.setIntPref(prefName, value);
					return;
				} else if (typeof value == "boolean") {
					prefBranch.setBoolPref(prefName, value);
					return;
				}

				iskipAssert(false, "iSkip.pref.set unknown pref type: "+prefName +" type: "+typeof value);
			} catch (e) {
				iskipError(e);
			}
		},


		checkOptions: function () {
			if ($("iskip-watch-debit").checked) {
				if (($("iskip-username").value.length < 1) || ($("iskip-password").value.length < 1)) {
					alert(iskipGetLString("alertNeedAccountInfo"));
					return false;
				}
			}
			return true;
		},


		loadFields: function () {
			$('iskip-password').value = iSkip.pref.getPassword();

			isUsername = ($("iskip-username").value && $("iskip-username").value.length > 0);
			isUsername ? $("iskip-password").focus() : $("iskip-username").focus();
		},

		getPassword: function () {
			var host = {value:""},
				user =  {value:""},
				password = {value:""};

			try {
				var logins = passwordManager.findLogins({}, ISKIP_URL, null, ISKIP_HTTP_REALM);

				for (var i = 0, len = logins.length; i < len; i++) {
					return logins[i].password;
					break;
				}
			} catch (err) {
				showMsg(err, true);
			}

			return password.value;
		},


		setPassword: function (password) {
			var loginInfo = new nsLoginInfo(ISKIP_URL, null, ISKIP_HTTP_REALM, iSkip.pref.get('username'), password, 'username', 'password');
			try {
				var logins = passwordManager.findLogins({}, ISKIP_URL, null, ISKIP_HTTP_REALM);

				for (var i = 0; i < logins.length; i++) {
					 passwordManager.removeLogin(logins[i]);
					 break;
				}
			} catch (err) {
				showMsg(err, true);
			}

			try {
				if (password && password.length > 0) {
					passwordManager.addLogin(loginInfo);
				}
			} catch (err) {
				showMsg(err, true);
			}
		},

		accountExist: function () {
			if((iSkip.pref.get('username')) && (iSkip.pref.getPassword())) {
				return true;
			} else {
				return false;
			}
		},

		accountChanged: function () {
			iSkip.pref.set('logged_SID', '');
		},


		updateGroupedUI: function (aPrefName, aGroupName) {
			var enable = $(aPrefName).getAttribute("checked");
			var elts = document.getElementsByAttribute("group", aGroupName);

			setTimeout( function() { Array.forEach(elts, function (e) { e.disabled = !enable; });}, 10);
		}
	}
}();
