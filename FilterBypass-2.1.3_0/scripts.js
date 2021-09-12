/* eslint-disable */
$(window).on('load', function() {

  var APP = {
    popup: function() {

      APP.domainsToProxyInitialCheck($('.c-switch'));

      $( '.c-icon' ).on('click', function() {
        $(this).toggleClass('c-icon--active');
        $('.c-tooltip__content').toggle();
      });

      $('.c-switch').on('change', 'input.c-checkbox', function(e) {
        var toggle = $(e.delegateTarget);
        var checkbox = $(e.currentTarget);
        
        if ( checkbox.is(':checked') ) {
          toggle.addClass('c-switch--active');

          setTimeout(function() {
            APP.checkDomainsToProxy(toggle, checkbox);
          }, 300);
        } else {
          toggle.removeClass('c-switch--active');

          if (typeof chrome.runtime !== 'undefined') {
            chrome.runtime.sendMessage({proxy_mode: false}, function(response) {
              $('#proxy_on').hide();
              $('#proxy_off').show();
            });
          }
        }
      });

      $('#go-to-options').on('click', function() {
         chrome.runtime.sendMessage({"action": "openOptionsPage"}, function(response) {});
      });
	  
	  $('#go-to-options-link').on('click', function() {
         chrome.runtime.sendMessage({"action": "openOptionsPage"}, function(response) {});
      });
	  
	  $('#show-proxified-domains').on('click', function() {
         chrome.runtime.sendMessage({"action": "openOptionsPage"}, function(response) {});
      });

      chrome.storage.sync.get(['domainsToProxy'], function(data) {
        var domainsToProxy = data.domainsToProxy;
        if(jQuery.isEmptyObject(domainsToProxy)) {
          $('.c-proxified').show();
        } else {
          //$('.c-proxified').css("visibility", "hidden");
          $('.c-proxified').hide();
        }
        
      });

    },

    domainsToProxyInitialCheck: function(toggle) {
      if (typeof chrome.storage !== 'undefined' && typeof chrome.runtime !== 'undefined') {
        var checkbox = toggle.find('input.c-checkbox');

        var promise = new Promise(function(resolve, reject) {
          var initialDomainsToProxy = [];
          chrome.storage.sync.get(['domainsToProxy'], function(data) {
            initialDomainsToProxy = data.domainsToProxy;
            resolve(initialDomainsToProxy);
          });
        });

        promise.then(function(initialDomainsToProxy) {
          if (!APP.isEmpty(initialDomainsToProxy) &&  initialDomainsToProxy.length > 0 && typeof chrome.runtime !== 'undefined') {

            chrome.storage.sync.get(['proxy_mode'], function(data) {
              var proxy_mode = data.proxy_mode;
              if(proxy_mode) {
                chrome.runtime.sendMessage({'proxy_mode': true}, function(response) {});
                $('#proxy_on').show();
                $('#proxy_off').hide();
                toggle.addClass('c-switch--active init-active');
                checkbox.prop('checked', true);
                setTimeout(function() {
                  toggle.removeClass('init-active');
                }, 400);
              }
            });
          }
        });
      }
    },


    checkDomainsToProxy: function(toggle, checkbox) {
      if (typeof chrome.storage !== 'undefined' && typeof chrome.runtime !== 'undefined') {
        checkbox.prop('disabled', true);

        var promise = new Promise(function(resolve, reject) {
          var hasDomainsToProxy = false;

          chrome.storage.sync.get(['domainsToProxy'], function(data) {
            if(!APP.isEmpty(data.domainsToProxy)) {
              hasDomainsToProxy = data.domainsToProxy.length;
            }
            resolve(hasDomainsToProxy);
          });
        });

        promise.then(function(hasDomainsToProxy) {
          checkbox.prop('disabled', false);
          if (!hasDomainsToProxy) {
            if (typeof chrome.runtime !== 'undefined') {
              chrome.runtime.sendMessage({'proxy_mode': false}, function(response) {});
              $('#proxy_on').hide();
              $('#proxy_off').show();
            }
            toggle.removeClass('c-switch--active');
            alert('You need to select sites to be proxy first in option page before enabling proxy mode');
            checkbox.prop('checked', false);
          } else {
            if (typeof chrome.runtime !== 'undefined') {
              chrome.runtime.sendMessage({'proxy_mode': true}, function(response) {});
              $('#proxy_on').show();
              $('#proxy_off').hide();
            }
          }
        });
      }
    },

    isEmpty: function isEmpty(str) {
      return (!str || 0 === str.length);
    },

    options: function() {
      var siteLists = $('.js-site-lists');
      var listItems = siteLists.find('.js-site-list-items');
      var control = siteLists.find('.js-site-lists-control');
      var listItemsAll = siteLists.find('.js-site-list-items-all');
      var listItemsSelected = siteLists.find('.js-site-list-items-selected');
      var controlsError = siteLists.find('.js-site-lists-control-error');
      var selectedItems = null;
      var txt = '';
      var domainsToProxy = [];

      if (typeof chrome.storage !== 'undefined') {
        const promise = new Promise(function(resolve, reject) {
          var storageDomainsToProxy = [];

          chrome.storage.sync.get(['domainsToProxy'], function(data) {
            storageDomainsToProxy = data.domainsToProxy;
            resolve(storageDomainsToProxy);
          });
        });

        promise.then(function(storageDomainsToProxy) {
          if (typeof storageDomainsToProxy !== 'undefined' && storageDomainsToProxy.length) {
            const listItemsLis = listItems.find('li');
    
            if (listItemsLis.length) {
              $.each(listItemsLis, function(i, li) {
                if (storageDomainsToProxy.includes($(li).text())) {
                  listItemsSelected.append($(li));
                }
              });
            }
          }
        });
      }

      listItems.on('click', 'li', function(e) {
        var listItem = $(e.target);
        var otherItems = $(e.delegateTarget).find('li');

        controlsError.hide();

        if (otherItems.length) {
          otherItems.removeClass('is-selected');
        }

        listItem.addClass('is-selected');
      });

      control.on('click', function(e) {
        var controlType = $(e.currentTarget).data('control-type');
        controlsError.hide();

        switch (controlType) {
          case 'all-down':
            var listItemsAllItems = listItemsAll.find('li');

            if (listItemsAllItems.length) {
              listItemsAllItems.appendTo(listItemsSelected);
            }

            selectedItems = listItemsSelected.find('li');

            if (selectedItems.length) {
              selectedItems.each(function(i, el) {
                txt = $(el).text();

                if (!domainsToProxy.includes(txt) && txt.trim() !== '') {
                  domainsToProxy.push(txt)
                }
              });
            }
            break;
          case 'all-up':
            var listItemsSelectedItems = listItemsSelected.find('li');

            if (listItemsSelectedItems.length) {
              listItemsSelectedItems.appendTo(listItemsAll);

              listItemsSelectedItems.each(function(i, el) {
                txt = $(el).text();
                
                if (domainsToProxy.indexOf(txt) !== -1) {
                  domainsToProxy.splice(domainsToProxy.indexOf(txt), 1);
                }
              });
            }
            break;
          case 'down':
            var listItemsAllSelectedItem = listItemsAll.find('li.is-selected');

            if (listItemsAllSelectedItem.length) {
              listItemsAllSelectedItem.appendTo(listItemsSelected).removeClass('is-selected');

              txt = listItemsAllSelectedItem.text();

              if (!domainsToProxy.includes(txt) && txt.trim() !== '') {
                domainsToProxy.push(txt)
              }
            } else {
              controlsError.show();
            }
            break;
          case 'up':
            var listItemsSelectedChosenItem = listItemsSelected.find('li.is-selected');

            if (listItemsSelectedChosenItem.length) {
              listItemsSelectedChosenItem.appendTo(listItemsAll);

              txt = listItemsSelectedChosenItem.text();
                
              if (domainsToProxy.indexOf(txt) !== -1) {
                domainsToProxy.splice(domainsToProxy.indexOf(txt), 1);
              }
            } else {
              controlsError.show();
            }
            break;
          default:
            break;
        }

        if (typeof chrome.storage !== 'undefined') {
          chrome.storage.sync.set({
            domainsToProxy: domainsToProxy,
          }, function() {
            if(APP.isEmpty(domainsToProxy)) {
            chrome.runtime.sendMessage({'proxy_mode': false}, function(response) {});
          }
          });
        }
      });
    }

  }
  APP.popup();
  APP.options();
});
