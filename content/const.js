var iskipDebug = false;
const ISKIP_NOTIFY_UPDATE = "updateInfo";
const ISKIP_OBSERVER_NET_STATUS = "network:offline-status-changed";

const SEC = 1000;
const MIN = 60*SEC;

const ISKIP_URL = 'chrome://iskip/';
const ISKIP_HTTP_REALM = 'iSkip';

const ISKIP_START_TIMEOUT = 5*SEC;
const NUM_BADWEATHER_ALERTS = 2;


const INTERVAL_UPDATE_DEBIT = 10*MIN;
const INTERVAL_UPDATE_UP = 5*MIN;
const INTERVAL_UPDATE_CINEMA = 10*MIN;
const INTERVAL_UPDATE_FILM = 10*MIN;
const INTERVAL_UPDATE_IP = 10*MIN;
const INTERVAL_UPDATE_TRAF = 20*MIN;
const INTERVAL_UPDATE_WEATHER = 15*MIN;


const OPEN_LINK_IN_CURRENT_TAB = 1;
const OPEN_LINK_IN_NEW_TAB = 2;
const OPEN_LINK_IN_NEW_WINDOW = 3;

if (typeof _iskip === "undefined" || !_iskip) {
	var _iskip = {};
}

_iskip.env = _iskip.env || {
	CC: Components.Constructor,
	Cc: Components.classes,
	Ci: Components.interfaces,
	Cr: Components.results
};

var ISKIP_PREF_SERVICE = _iskip.env.Cc['@mozilla.org/preferences-service;1'].getService(Components.interfaces.nsIPrefService);
var ISKIP_NOTIFY_SERVICE = _iskip.env.Cc["@mozilla.org/alerts-service;1"].getService(Components.interfaces.nsIAlertsService);
var ISKIP_OBSERVER_SERVICE = _iskip.env.Cc["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService);
var ISKIP_COOKIEMANAGER_SERVICE = _iskip.env.Cc["@mozilla.org/cookiemanager;1"].getService(Components.interfaces.nsICookieManager);
var ISKIP_PROMPT_SERVICE = _iskip.env.Cc["@mozilla.org/embedcomp/prompt-service;1"].getService(Components.interfaces.nsIPromptService);
var ISKIP_MIME_SERVICE = _iskip.env.Cc["@mozilla.org/mime;1"].getService(Components.interfaces.nsIMIMEService);
var ISKIP_STRING_INPUT_STREAM_SERVICE = _iskip.env.Cc["@mozilla.org/io/string-input-stream;1"].createInstance(Components.interfaces.nsIStringInputStream);
var ISKIP_IO_SERVICE = _iskip.env.Cc["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);
var ISKIP_BOOKMARK_SERVICE = _iskip.env.Cc["@mozilla.org/browser/nav-bookmarks-service;1"].getService(Components.interfaces.nsINavBookmarksService);
var ISKIP_HISTORY_SERVICE = _iskip.env.Cc["@mozilla.org/browser/nav-history-service;1"].getService(Components.interfaces.nsINavHistoryService);
var ISKIP_ANNOTATION_SERVICE = _iskip.env.Cc["@mozilla.org/browser/annotation-service;1"].getService(Components.interfaces.nsIAnnotationService);
var ISKIP_XMLHTTP_SERVICE = _iskip.env.Cc['@mozilla.org/xmlextras/xmlhttprequest;1'];
var ISKIP_FILEINPUT_STREAM = _iskip.env.Cc['@mozilla.org/network/file-input-stream;1'];
var ISKIP_STRINGINPUT_STREAM = _iskip.env.Cc["@mozilla.org/io/string-input-stream;1"];


// URLs
const ISKIP_STAT_LOGIN_URL = "https://stat.lluga.net/login/api2.php?a=login";
const ISKIP_WATCH_DEBIT_URL = "https://stat.lluga.net/login/api.php";
const ISKIP_WATCH_WEATHER_URL = "http://export.yandex.ru/weather/";
const ISKIP_WATCH_IP_URL = "http://game.lluga.net/getip.php";
const ISKIP_WATCH_UP_URL = "http://up.lluga.net/api.php?a=new";
const ISKIP_WATCH_CINEMA_URL = "http://cinema.lds.net.ua/rss_films.php";
const ISKIP_WATCH_FILM_URL = "http://film.lg.ua/rss_films.php";

//
const ISKIP_URL_FORUM = "http://forum.lluga.net/";
const ISKIP_URL_PORTAL = "http://portal.iteam.net.ua/";
const ISKIP_URL_HOSTING = "https://hosting.iteam.lg.ua/";
const ISKIP_URL_HOSTING_ORDER = "https://stat.lluga.net/hosting.php";
const ISKIP_URL_HOSTING_CPANEL = "https://hosting.iteam.lg.ua:2083/";
const ISKIP_URL_UP = "http://up.lluga.net/";
const ISKIP_URL_PORTAL = "http://portal.lluga.net/";
const ISKIP_URL_FTP = "http://files.iteam.net.ua/";

const ISKIP_URL_FTP_SOFT = "http://soft.iteam.net.ua/";
const ISKIP_URL_FTP_GAME = "http://games.iteam.net.ua/";
const ISKIP_URL_FTP_MUSIC = "http://music.iteam.net.ua/";
const ISKIP_URL_FTP_JOURNAL = "http://journal.iteam.net.ua/";
const ISKIP_URL_FTP_ANIME = "http://film.lg.ua/anime/";
const ISKIP_URL_FTP_HDTV = "http://film.lg.ua/hdtv/";
const ISKIP_URL_FTP_SERIAL = "http://film.lg.ua/serial/";
const ISKIP_URL_FTP_UPLOAD = "http://film.lg.ua/upload/";

const ISKIP_URL_MIRROR = "http://mirror.lluga.net/";
const ISKIP_URL_KINO = "http://film.lg.ua/";
const ISKIP_URL_RADIO = "http://radio.lluga.net:8000/";
const ISKIP_URL_PHOTO = "http://photo.lluga.net/";
const ISKIP_URL_HOME = "http://www.iteam.net.ua/";
const ISKIP_URL_STAT = "https://stat.lluga.net/";
const ISKIP_URL_CONTACTS = "http://www.iteam.net.ua/contacts.html";
const ISKIP_URL_SUPPORT = "chrome://iskip/content/pages/aboutRobots.xhtml";
const ISKIP_URL_LABS = "http://forum.lluga.net/labs/";
const ISKIP_URL_FTP_SEARCH = "http://portal.lluga.net/find.php";
const ISKIP_URL_PAY_WEBMONEY = 'https://stat.lluga.net/pay/webmoney/'
const ISKIP_URL_PAY_CARDS = 'https://stat.lluga.net/pay/cards/'
//
const ISKIP_UPLOAD_URL = 'http://up.lluga.net/upload_drop.php';
const ISKIP_DOWNLOAD_ITEM_URL = 'http://up.lluga.net/';
const ISKIP_URL_DROPIO_HELP = 'http://forum.lluga.net/';


// iDrop
// in bytes
const MAX_UPLOAD_FILESIZE = 5000*1048576;
const MAX_DIRECT_UPLOAD_FILESIZE = 30*1048576;
const MAX_UPLOAD_NUM_FILES = 10;
const ISKIP_UPLOAD_BUFFER_SIZE = 65536*4;
const PROGRESS_START_TIMEOUT = 5*SEC;
const PROGRESS_TIMEOUT = 2*SEC;


// alerts icons
const ALERT_ICON_ERROR = "chrome://iskip/skin/classic/alert/dialog-error.png";
const ALERT_ICON_WARNING = "chrome://iskip/skin/classic/alert/dialog-warning.png";
const ALERT_ICON_INFO = "chrome://iskip/skin/classic/alert/dialog-information.png";
const ALERT_ICON_NET_ERROR = "chrome://iskip/skin/classic/alert/network-error.png";
const ALERT_ICON_QUESTION = "chrome://iskip/skin/classic/alert/dialog-question.png";

// setUploadProgress mode
const ISKIP_DEFAULT_UPLOAD = 1;
const ISKIP_DOWNLOAD_UPLOAD = 2;
const ISKIP_AFTER_DOWNLOAD_UPLOAD = 3;

const ISKIP_UP_BOOKMARK_FOLDER = 'up.lluga.net';
