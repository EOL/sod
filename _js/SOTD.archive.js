// http://eol.org/api/docs/collections
// http://eol.org/api/docs/pages

;(function($, undefined) {
	if (false || ! window.console) {
		var names = ["log", "debug", "info", "warn", "error", "assert", "dir", "dirxml",
		"group", "groupEnd", "time", "timeEnd", "count", "trace", "profile", "profileEnd"];

		console = {};
		
		for (var i = 0; i < names.length; ++i) {
			console[names[i]] = function() {}
		}	
	}
	
	// http://phpjs.org/functions/ucwords:569
	
	function ucwords (str) {
		return (str + '').replace(/^([a-z])|\s+([a-z])/g, function ($1) {
			return $1.toUpperCase();
		});
	}
	
	// http://phpjs.org/functions/ucfirst:568
	
	function ucfirst (str) {
		str += '';
		var f = str.charAt(0).toUpperCase();
		return f + str.substr(1);
	}
	
	function hasValidSortField (item) {
		if (item && item.hasOwnProperty("sort_field")) {
			return /^\d+\.\d+$/.test(item.sort_field);
		} else {
			return false;
		}	
	}

	$.sotdarchive = function (element, options) {
		var defaults = {
			collection_id: 10986,
			collection_url: "http://eol.org/api/collections/1.0/",
			pages_url: "http://eol.org/api/pages/1.0/",
			nominate_url: "http://eol.org/collections/10986/newsfeed",
			cache_ttl: 86400
			/* cache_ttl: 604800 */
		};
		
		var months = [
			"January", "February", "March",
			"April", "May", "June",
			"July", "August", "September",
			"October", "November", "December"
		];
		
		var plugin = this;
		
		plugin.settings = {};
		
		var $element = $(element);
		var element = element;

		if (true && ! $.browser.msie) {
			$element.addClass("sotd-archive-css3");
		}
		
		var page = 1;
		var per_page = 50;
		var npages = null;
		var total_items = 0;
		var collection = [];
		var keys = [];
		var pos = null;
		var queue = [];
		
		function error (message) {
			console.log("sotdarchive.error()", message);
		}
		
		function getCollection () {
			console.log("sotdarchive.getCollection()", page, npages);
		
			var data = {
				filter: "taxa",
				per_page: per_page,
				sort_by: "sort_field", //"sort_field","reverse_sort_field"
				page: page,
				cache_ttl: plugin.settings.cache_ttl
			};
		
			$.ajax({
				url: plugin.settings.collection_url + plugin.settings.collection_id + ".json",
				data: data,
				cache: true,
				dataType: "jsonp",
				jsonpCallback: "collectionLoadedCallback",
				success: collectionLoaded
			});
		}

		var last_month = -1;
		
		function collectionLoaded (data) {
			console.log("sotdarchive.collectionLoaded()", page);
		
			if (npages === null) {
				total_items = data.total_items;
				npages = Math.ceil(total_items / per_page);
			}
			
			if (data.collection_items.length == 0) {
				error("collectionLoaded() data.collection_items.length == 0");
			} else {
				queue = data.collection_items;
			
				for (var i = 0; i < queue.length; i++) {
					var item = queue[i];
					
					if (item && hasValidSortField(item)) {
						var month = parseInt(item.sort_field.replace(/\.01$/, ""), 10) - 1;
						
						if (month != last_month) {
							$element.append("<h2>" + months[month] + "</h2>");
						}
						
						last_month = month;
						
						var $item = $("<div class='sotd-archive-item sotd-archive-item-" + item.sort_field.replace(/\./g, "-") + "'></div>");

						$element.append($item);
					}
				}
			
				processQueue();
			}
		}
		
		function processQueue () {
			if (queue.length == 0) {
				if (++page <= npages) {
					getCollection(page);
				}
			} else {
				var item = null;
				
				while (queue.length) {
					item = queue.shift();
					if (item && hasValidSortField(item)) {
						break;
					}
				}
				
				if (item && hasValidSortField(item)) addArchiveItem(item);
			}
		}
				
		function addArchiveItem (item) {
			console.log("sotdarchive.addArchiveItem()", item.object_id, item.sort_field);

			var data = {
				images: 1,
				videos: 0,
				sounds: 0,
				maps: 0,
				text: 0,
				iucn: 0,
				subject: "all",
				licenses: "all",
				details: 1,
				common_names: 1,
				vetted: 2,
				cache_ttl: plugin.settings.cache_ttl
			};

			$.ajax({
				url: plugin.settings.pages_url + item.object_id + ".json",
				data: data,
				cache: true,
				dataType: "jsonp",
				jsonpCallback: "addArchiveItemCallback",
				success: function (data) {
					console.log("sotdarchive.buildWidget.loaded()", data.identifier);
					
					var $item = $(".sotd-archive-item-" + item.sort_field.replace(/\./g, "-"));
					
					var i;
					var n;
					
					if (data.error || data.taxonConcepts === undefined) {
						$item.remove();
						processQueue();
					}
					
					var description = item.annotation;
					
					var rank = "Species";
					for (i = 0; i < data.taxonConcepts.length; i++) {
						if (data.taxonConcepts[i].taxonRank) {
							rank = data.taxonConcepts[i].taxonRank;
							break;
						}
					}
						
					switch (rank) {
						case "Sp.": rank = "Species"; break;
						case "Gen.": rank = "Genus"; break;
						case "Subfam.": case "Subf.": rank = "Subfamily"; break;
						case "Fam.": rank = "Family"; break;
						case "Ord.": rank = "Order"; break;
						case "Cl.": rank = "Class"; break;
						case "Phyl.": rank = "Phylum"; break;
						case "Div.": rank = "Division"; break;
						case "Regn.": rank = "Kingdom"; break;
					}

					var scientificName = data.scientificName.split(" ");
					
					if (rank == "Species") {
						if (scientificName.length > 1) scientificName = scientificName[0] + " " + scientificName[1];
						else scientificName = scientificName[0];
						scientificName = "<span class='latin'>" + ucfirst(scientificName) + "</span>";
					} else if (rank == "Genus") {
						scientificName = rank + ": " + "<span class='latin'>" + ucfirst(scientificName[0]) + "</span>";
					} else {
						scientificName = rank + ": " + ucfirst(scientificName[0]);
					}
						
					var vernacularName = null;
					if (data.hasOwnProperty("vernacularNames") && data.vernacularNames.length > 0) {
						n = data.vernacularNames.length;
						for (i = 0; i < n; i++) {
							if (data.vernacularNames[i].eol_preferred == true &&
								data.vernacularNames[i].language == "en") {
								vernacularName = data.vernacularNames[i].vernacularName;
								break;
							}
						}
						
						if (vernacularName == null) {
							for (i = 0; i < n; i++) {
								if (data.vernacularNames[i].language == "en") {
									vernacularName = data.vernacularNames[i].vernacularName;
									break;
								}
							}
						}
					}
					
					var images = [];
					
					if (data.hasOwnProperty("dataObjects") && data.dataObjects.length > 0) {
						n = data.dataObjects.length;
						for (i = 0; i < n; i++) {
							if (data.dataObjects[i].dataType == "http://purl.org/dc/dcmitype/StillImage"
								&& data.dataObjects[i].eolMediaURL) {
								images.push({
									media: data.dataObjects[i].eolMediaURL,
									//thumbnail: data.dataObjects[i].eolThumbnailURL,
									thumbnail: data.dataObjects[i].eolMediaURL.replace(/\_orig\.jpg$/, "_130_130.jpg"),
									title: data.dataObjects[i].title,
									description: data.dataObjects[i].description
								});
							}
						}
					}
					
					var parts = item.sort_field.split(".");
					var mm = parseInt(parts[0], 10);
					var dd = parseInt(parts[1], 10);
					var date = months[mm-1] + " " + dd;
					
					var $front = $("<div class='sotd-archive-front sotd-archive-side'></div>");
					if (images.length > 0) var $img = $("<img class='sotd-archive-thumbnail' src='" + images[0].thumbnail + "' alt='" + images[0].title + "' title='" + images[0].title + "' />");
					
					$front.append($img);

					var $back = $("<div class='sotd-archive-back sotd-archive-side'></div>");
				
					$back.append("<span class='sotd-archive-date'>" + date + "</a></span>");

					if (vernacularName) {
						$back.append("<span class='sotd-archive-common-name'><a href='http://eol.org/pages/" + data.identifier + "/overview'>" + ucwords(vernacularName) + "</a></span>");
						$back.append("<span class='sotd-archive-scientific-name'>" + scientificName + "</span>");
					} else {
						$back.append("<span class='sotd-archive-common-name'><a href='http://eol.org/pages/" + data.identifier + "/overview'>" + scientificName + "</a></span>");
					}

					$back.find("a").bind("click", function backAClick (event) {
						event.stopPropagation();
					});
					
					$item.append($front);
					$item.append($back);
					
					$item.data("side", "front");

					if (true && $element.hasClass("sotd-archive-css3")) {
						$item.hover(function () {
							var $this = $(this);
							
							$this.addClass("flipped");
						}, function () {
							var $this = $(this);
							
							$this.removeClass("flipped");
						});
					} else {
						$item.hover(function () {
							var $this = $(this);
							
							$this.addClass("flipped");
							
							$(".sotd-archive-back", $this).stop().animate({
								top: "0px"
							}, 250);
						}, function () {
							var $this = $(this);
							
							$this.removeClass("flipped");
							
							$(".sotd-archive-back", $this).stop().animate({
								top: "130px"
							}, 250);
						});
					}
					
					processQueue();
				}
			});
		}
		
		plugin.init = function () {
			plugin.settings = $.extend({}, defaults, options);
			
			$element.empty();
			
			getCollection();
			
			$element.addClass("sotd-archive");
		};
		
		plugin.init();
	};
	
	$.fn.sotdarchive = function(options) {
        return this.each(function() {
            if (undefined == $(this).data('sotdarchive')) {
                var plugin = new $.sotdarchive(this, options);
                $(this).data('sotdarchive', plugin);
            }
        });
    }
})(jQuery);
