//Helper functions start
function strpos(haystack, needle, offset) {
    var i = (haystack+'').indexOf(needle, (offset || 0));
    return i === -1 ? false : true;
  }  
  
function strposa(haystack, needle, offset) {
      if(Array.isArray(needle) == false)needle=Array(needle);
      for (var i=0; i < needle.length; i++) {
      	if(strpos(haystack, needle[i]) != false) return true;
      }
      return false;
}

function strposa_key(haystack, needle, offset) {
	if(Array.isArray(needle) == false)needle=Array(needle);
	for (var i=0; i < needle.length; i++) {
		if(strpos(haystack, needle[i]) != false) return needle[i];
	}
	return false;
}

function isEmpty(value){
	return (value == null || value.length === 0);
  }

function getRandomProxy() {
	//US proxy 
	let proxy_list = [
		"172.107.20.249:53756"
	];
	let randomProxy = proxy_list[Math.floor(Math.random() * proxy_list.length)];
	return randomProxy;
}

function setIPAddress()
{
	$.ajax({
		type: "GET",
		url: "https://api64.ipify.org/",
		cache:false,
        success: function(responseText){
			ip_address = responseText;
        },
        error: function(XMLHttpRequest, textStatus, errorThrown) {
			//if required, do some error handling
			if(errorThrown) {
				console.warn(errorThrown);
			}
			
        }
    });
}

function storeLog(log)
{
	$.ajax({
		type: "POST",
		url: "https://www.filterbypass.me/api/store_addon_log",
		data: log,
        success: function(responseText){
			//
        },
        error: function(XMLHttpRequest, textStatus, errorThrown) {
			//if required, do some error handling
			if(errorThrown) {
				console.warn(errorThrown);
			}
        }
    });
}

function setProxy()
{
	if(isEmpty(domainsToProxy)) {
		updateBrowserActionIcon();
		clearProxy();
		return;
	} 

	if(!proxy_mode) {
		updateBrowserActionIcon();
		clearProxy();
		return;
	}

	let domainsToProxy_str = "";

	domainsToProxy.forEach(domain => {
		domainsToProxy_str += '"*.' + domain + '" ,';
	});

	let proxy_str = getRandomProxy();

	domainsToProxy_str = domainsToProxy_str.slice(0, -1);

	let pacScriptData = 'function FindProxyForURL(r,e){if(r=r.toLowerCase(),e=e.toLowerCase(),isPlainHostName(e))return"DIRECT";var t=['+ domainsToProxy_str +'];for(i=0;i<t.length;i++)if(shExpMatch(e,t[i]))return"PROXY 172.107.20.249:53756; DIRECT";return"DIRECT"}';

	let config = {
		mode: "pac_script",
		pacScript: {
			data: pacScriptData
		}
	};

	chrome.proxy.settings.set({value: config, scope: 'regular'}, function() {
		updateBrowserActionIcon();
	});
	
}

function updateBrowserActionIcon()
{
	if(proxy_mode) {
		chrome.browserAction.setIcon({
			path : {
				"16":"images/logo-blocked-16.png",
				"32":"images/logo-blocked-32.png",
				"48":"images/logo-blocked-48.png",
				"128":"images/logo-blocked-128.png"
			}
		  });
	} else {
		chrome.browserAction.setIcon({
			path : {
				"16":"images/logo-16.png",
				"32":"images/logo-32.png",
				"48":"images/logo-48.png",
				"128":"images/logo-128.png"
			}
		  });
	}
}

function clearProxy()
{
	chrome.proxy.settings.clear({scope: 'regular'}, function() {});
}


  
/**
 * Returns a handler which will open a new window when activated.
 */
function getClickHandler() {
	return function(info, tab) {

	let url = 'https://www.filterbypass.me/#url=' + info.pageUrl;

	// Create a new tab
	chrome.tabs.create({ url: url});
	};
};
    
function getClickHandlerListenMode() {
	return function(info, tab) {
	
	let url = 'https://www.filterbypass.me/#url=' + info.pageUrl;
	
	if(strpos(info.pageUrl, "https://www.youtube.com/watch?v=") != false) {
		url += '%26listen=1';
		chrome.tabs.create({ url: url});
	} else {
		alert('This feature works only for Youtube');
	}
	
	};
};
  
function openOptionsPage() {
	chrome.runtime.openOptionsPage();
}


function shouldRedirectVideoPage(url,domains) {
	let key = strposa_key(url, domains);

	if(key == false) {
		return false;
	}

	let domain_regex_dict = { 
		"youtube.com" : /^https:\/\/www\.youtube\.com\/watch\?v=/gi,
		"dailymotion.com" : /^https:\/\/www\.dailymotion\.com\/video\//gi,
		"twitch.tv" : /^https:\/\/www\.twitch\.tv\/videos\/(\d+)/gi,
		"vimeo.com" : /^https?:\/\/vimeo\.com\/(\d+)/gi
	};

	if (domain_regex_dict.hasOwnProperty(key)) {
		let regex = domain_regex_dict[key];
		return regex.test(url);
	}
	return false;
}

//Helper function end

//Global variables start
var ip_address = "";
var proxy_mode = false;
var domainsToProxy = [];
//Global variables end

chrome.runtime.onStartup.addListener(function() { 
	//Set current ip address
	setIPAddress();

	chrome.storage.sync.get(['proxy_mode'], function(data) {
		proxy_mode = data.proxy_mode;
		setProxy();
		updateBrowserActionIcon();
	});

	chrome.storage.sync.get(['domainsToProxy'], function(data) {
		domainsToProxy = data.domainsToProxy;
		setProxy();
		updateBrowserActionIcon();
	});

	chrome.proxy.settings.get({'incognito': false},function(config) {
		if(proxy_mode && config.levelOfControl != "controlled_by_this_extension") {
			alert('You seems to have another vpn/proxy extension taking control of your browser proxy settings.Please disable that extension so that FilterBypass Addon can proxy the request.');
		}
	});
});

chrome.runtime.onInstalled.addListener(function() {

	setIPAddress();

	chrome.storage.sync.get(['proxy_mode'], function(data) {
		proxy_mode = data.proxy_mode;
		setProxy();
		updateBrowserActionIcon();
	});

	chrome.storage.sync.get(['domainsToProxy'], function(data) {
		domainsToProxy = data.domainsToProxy;
		setProxy();
		updateBrowserActionIcon();
	});

	chrome.alarms.create('refresh', { periodInMinutes: 5 });
});

chrome.alarms.onAlarm.addListener(function(alarm) {
	if (alarm && alarm.name === 'refresh') {
		setIPAddress();
	}
});

chrome.storage.onChanged.addListener(function(changes, namespace) {
	for(key in changes) {
	  if(key === 'proxy_mode') {
		chrome.storage.sync.get(['proxy_mode'], function(data) {
			proxy_mode = data.proxy_mode;
			setProxy();
			updateBrowserActionIcon();
		});
	  }
	  if(key === 'domainsToProxy') {
		chrome.storage.sync.get(['domainsToProxy'], function(data) {
			domainsToProxy = data.domainsToProxy;
			if(domainsToProxy.includes('youtube.com')) {
				if(!domainsToProxy.includes('ytimg.com')) domainsToProxy.push('ytimg.com');
				if(!domainsToProxy.includes('gstatic.com')) domainsToProxy.push('gstatic.com');
				if(!domainsToProxy.includes('ggpht.com')) domainsToProxy.push('ggpht.com');
				if(!domainsToProxy.includes('googleapis.com')) domainsToProxy.push('googleapis.com');
			}
	
			if(domainsToProxy.includes('vimeo.com')) {
				if(!domainsToProxy.includes('vimeocdn.com')) domainsToProxy.push('vimeocdn.com');
			}

			if(domainsToProxy.includes('twitch.tv')) {
				if(!domainsToProxy.includes('jtvnw.net')) domainsToProxy.push('jtvnw.net');
				if(!domainsToProxy.includes('twitchcdn.net')) domainsToProxy.push('twitchcdn.net');
			}

			if(isEmpty(domainsToProxy) && proxy_mode)
			{
				chrome.storage.sync.set({'proxy_mode': false}, function() {});
			}

			chrome.storage.sync.set({'domainsToProxy': domainsToProxy}, function() {
				setProxy();
				updateBrowserActionIcon();
			});
		});
	  }
	}
  });

  
chrome.runtime.onMessage.addListener(
function(request, sender, sendResponse) {
	if (request.hasOwnProperty('proxy_mode')) {
		chrome.storage.sync.set({'proxy_mode': request.proxy_mode}, function() {
			setProxy();
		});
	}
	if(request.hasOwnProperty("msg") && request.msg == "getIP") {
		sendResponse({ip: ip_address})
	}

	if(request.hasOwnProperty("msg") && request.msg == "getProxyMode") {
		sendResponse({proxy_mode: proxy_mode});
	}

	switch (request.action) {
		case "openOptionsPage":
			openOptionsPage();
			break;
		default:
			break;
	}
	sendResponse({complete: true});
});

chrome.contextMenus.create({
"title" : "Proxy with FilterBypass",
"type" : "normal",
"onclick" : getClickHandler()
});

chrome.contextMenus.create({
"title" : "Proxy with FilterBypass(Listen only mode)",
"type" : "normal",
"onclick" : getClickHandlerListenMode()
});


chrome.webRequest.onCompleted.addListener(function(d){

	let hostname = new URL(d.url).hostname;
	if (proxy_mode && strposa(hostname, domainsToProxy) && d.url != "https://www.filterbypass.me/api/store_addon_log")  {
		let log = {cilent_ip: ip_address , url: d.url , timestamp: d.timeStamp};
		storeLog(log);
	}

},{urls:[
	"http://*/*",
	"https://*/*"],
   types:["main_frame","sub_frame"]});


chrome.webRequest.onBeforeSendHeaders.addListener(function(d) {

	for (var i = 0; i < d.requestHeaders.length; ++i) {
	if (d.requestHeaders[i].name === 'Location') {
		if(shouldRedirectVideoPage(d.requestHeaders[i].value,domainsToProxy) && proxy_mode) {
			let redirectUrl = 'https://www.filterbypass.me/#url=' + encodeURIComponent(d.requestHeaders[i].value);
			return {redirectUrl: redirectUrl};
		}
		break;
	}
	}
	return {requestHeaders: d.requestHeaders};
},
{urls: ["<all_urls>"]},
["blocking", "requestHeaders"]);


chrome.webRequest.onBeforeRequest.addListener(function(d){

	let hostname = new URL(d.url).hostname;
	if(d.url.startsWith("https://www.youtube.com/youtubei/v1/next?key=") && strposa(hostname, domainsToProxy) && proxy_mode) {
		if(d.method == "POST")
            var requestBody = JSON.parse(decodeURIComponent(String.fromCharCode.apply(null,
									  new Uint8Array(d.requestBody.raw[0].bytes))));
									  
			if(!isEmpty(requestBody.videoId)) {
				if(shouldRedirectVideoPage('https://www.youtube.com/watch?v=' + requestBody.videoId,domainsToProxy)) {
					let redirectUrl = 'https://www.filterbypass.me/#url=https://www.youtube.com/watch?v=' + encodeURIComponent(requestBody.videoId);
					chrome.tabs.update({url: redirectUrl});
				}
				
				return {cancel: true};
			}
	}

	if(shouldRedirectVideoPage(d.url,domainsToProxy) && proxy_mode) {
		let redirectUrl = 'https://www.filterbypass.me/#url=' + encodeURIComponent(d.url);
		return {redirectUrl: redirectUrl};
	}

	return {cancel: false};

},{urls:["<all_urls>"]},
["blocking","requestBody"]);
	


chrome.webRequest.onErrorOccurred.addListener(function(d){

	let hostname = new URL(d.url).hostname;
	if(proxy_mode && strposa(hostname, domainsToProxy)) {
		console.log(JSON.stringify(d));
	}
	
	
},{urls:[
	"http://*/*",
	"https://*/*"]});