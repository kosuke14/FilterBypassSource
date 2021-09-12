function isEmpty(str) {
    return (!str || 0 === str.length);
}

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


// Add logging
if (strpos(document.location.href, "filterbypass.me"))  {
	if($('#filterbypass_search-form').length) {
		chrome.storage.sync.get(['domainsToProxy'], function(data) {
			let domainsToProxy = data.domainsToProxy;
			if (strposa(document.location.href, domainsToProxy))  {
				chrome.runtime.sendMessage({ msg: "getProxyMode" }, function(response) {
					if(!isEmpty(response.proxy_mode) && response.proxy_mode) {
						chrome.runtime.sendMessage({ msg: "getIP" }, function(response) {
							if(!isEmpty(response.ip)) {
								var input = $("<input>")
									.attr("type", "hidden")
									.attr("name", "client_ip").val(response.ip);
									
								$('#filterbypass_search-form').append(input);
							}
						});	
			
					}
				});	
			}
		});
	}
}

			   