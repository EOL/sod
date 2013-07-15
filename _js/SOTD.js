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
	
	//
	
	$.sotd = function (element, options) {
		var defaults = {
			collection_id: 10986,
			collection_url: "http://eol.org/api/collections/1.0/",
			pages_url: "http://eol.org/api/pages/1.0/",
			nominate_url: "http://eol.org/collections/10986/newsfeed",
			archive_url: "http://www.mnh.si.edu/sod/archive.html",
			timeout: 10000,
			cache_ttl: 86400
			/* cache_ttl: 604800 */
		};
		
		var plugin = this;
		
		plugin.settings = {};
		
		var $element = $(element);
		var element = element;
		
		var page = 1;
		var per_page = 400;
		var npages = null;
		var total_items = 0;
		var collection = [];
		var keys = [];
		var pos = null;
		
		function error (message) {
			console.error("sotd.error()", message);
			
			$(".sotd-widget-loading", $element).remove();
			$(".sotd-widget-inner", $element).after("<div class='sotd-widget-error'>EOL is unavailable, please try back later</div>");
		}
		
		function getCollection () {
			console.log("sotd.getCollection()", page);
		
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
				timeout: defaults.timeout,
				error: function (jqXHR, textStatus, errorThrown) {
					error("sotd.getCollection.error(): " + textStatus);
				},
				success: collectionLoaded
			});
		}

		function collectionLoaded (data) {
			console.log("sotd.collectionLoaded()", page);
		
			if (npages === null) {
				total_items = data.total_items;
				npages = Math.ceil(total_items / per_page);
			}
			
			if (data.collection_items.length == 0) {
				error("collectionLoaded() data.collection_items.length == 0");
			} else {
				var i;
				var n = data.collection_items.length;
				
				for (i = 0; i < n; i++) {
					var item = data.collection_items[i];
					
					if (!item.sort_field || item.sort_field == "") continue;
					
					var key = item.sort_field.replace(/\./g, "-");
					collection[key] = item;
					
					// console.log("sotd.collectionLoaded()", "added item for", key);
				}
				
				keys = [];
				for (var key in collection) keys.push(key);
				keys.sort();
				
				collectionDoneLoaded();
			}
		}
		
		function collectionDoneLoaded () {
			console.log("sotd.collectionDoneLoaded()");
		
			var item;
			var date = $element.data("date");
			
			if (date) {
				var dir = $element.data("dir");
				if (! dir) dir = -1;
				item = findItem(date, dir);
			} else {
				item = findItem(new Date(), -1);
			}
			
			if (item) buildWidget(item);
			else error("sotd.collectionDoneLoaded() item == null");
		}
		
		function findItem (date, dir) {
			var year = date.getFullYear();
			var month = date.getMonth() + 1;
			var day = date.getDate();
			
			console.log("sotd.findItem()", year, month, day, dir);
			
			if (month < 10) month = "0" + month;
			else month = "" + month;
			
			if (day < 10) day = "0" + day;
			else day = "" + day;
			
			var key = /* year + "-" + */ month + "-" + day;
			
			if (collection[key]) {
				var i;
				var n = keys.length;
				
				for (i = 0; i < n; i++) {
					if (keys[i] == key) {
						pos = i;
						break;
					}
				}
				
				$element.data("date", date);
				$element.data("dir", dir);
				return collection[key];
			} else {
				if (dir == -1 && key < keys[0]) {
					$element.data("date", date);
					$element.data("dir", dir);
					if (++page <= npages) {
						getCollection(page);
					} else {
						error("findItem() page > npages");
						return null;
					}
				} else if (dir == 1 && key > keys[keys.length-1]) {
					error("findItem() key > keys[keys.length-1]");
					return null;
				} else {
					return findItem(new Date(date.getTime() + dir * 24 * 60 * 60 * 1000), dir);
				}
			}
		}
		
		function buildWidget (item) {
			console.log("sotd.buildWidget()", item);
		
			var data = {
				images: 75,
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
			
			if ($element.find(".sotd-widget-loading").length == 0) {
				$element.find(".sotd-widget-archive").after("<span class='sotd-widget-loading replace'>Loading</span>");
				$element.find(".sotd-widget-archive").remove();
			}
			
			$.ajax({
				url: plugin.settings.pages_url + item.object_id + ".json",
				data: data,
				cache: true,
				dataType: "jsonp",
				jsonpCallback: "buildWidgetCallback",
				timeout: defaults.timeout,
				error: function (jqXHR, textStatus, errorThrown) {
					error("sotd.buildWidget.error(): " + textStatus);
				},
				success: function (data) {
					console.log("sotd.buildWidget.success()", data);
					
					var i;
					var n;
					
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
							if (data.dataObjects[i].dataType == "http://purl.org/dc/dcmitype/StillImage") {
								images.push({
									media: data.dataObjects[i].eolMediaURL,
									//thumbnail: data.dataObjects[i].eolThumbnailURL,
									thumbnail: data.dataObjects[i].eolMediaURL.replace(/\_orig\.jpg$/, "_260_190.jpg"),
									title: data.dataObjects[i].title,
									description: data.dataObjects[i].description
								});
							}
						}
					}
					
					$element.data("images", images);
									
					$element.empty();
					
					var $inner = $("<div class='sotd-widget-inner'></div>");
					
					$inner.append("<span class='sotd-widget-eol-logo replace'>EOL Species of the Day</span>");

					if (images.length > 0) {
						if (typeof(hs) != "undefined") {
							var $gallery = $("<div class='highslide-gallery'></div>");
							
							n = images.length;
							for (i = 0; i < n; i++) {
								var $a = $("<a class='highslide' href='" + images[i].media + "'><img class='sotd-widget-thumbnail' src='" + images[i].thumbnail + "' alt='" + images[i].title + "' title='" + images[i].title + "' /></a>");
								$gallery.append($a);

								if (images[i].description) {
									var $caption = $("<div class='highslide-caption'>" + images[i].description + "</div>");
									$gallery.append($caption);
								}
							}
							
							$gallery.find("a.highslide:gt(0)").addClass("hidden");
							
							$gallery.find("a.highslide").each(function(i) {
								var $this = $(this);
								$this.attr("id", "sotd-thumbnail-" + i);
								this.onclick = function () {
									var options = {
										thumbnailId: 'sotd-thumbnail-0',
										spaceForCaption: 80
									}
									return hs.expand(this, options);
								};
							});
							
							$inner.append($gallery);
						} else {
							var $img = $("<img class='sotd-widget-thumbnail' src='" + images[0].thumbnail + "' alt='" + images[0].title + "' title='" + images[0].title + "' />");
							$inner.append($img);
						}
					}

					var $metadata = $("<div class='sotd-widget-metadata'></div>");

					if (vernacularName) {
						$metadata.append("<span class='sotd-widget-common-name'><a href='http://eol.org/pages/" + data.identifier + "/overview'>" + ucwords(vernacularName) + "</a></span>");
						$metadata.append("<span class='sotd-widget-scientific-name'>(" + scientificName + ")</span>");
					} else {
						$metadata.append("<span class='sotd-widget-common-name'><a href='http://eol.org/pages/" + data.identifier + "/overview'>" + scientificName + "</a></span>");
					}
					
					$metadata.append("<span class='sotd-widget-description'>" + description + "</span>");
					
					$inner.append($metadata);

					$inner.append("<a class='sotd-widget-nominate' href='" + plugin.settings.nominate_url + "' rel='external'>Nominate a Species</a>");
					
					$element.append($inner);
					
					var $prev = $("<a class='sotd-widget-prev replace' href='#'>Prev</a>");
					var $next = $("<a class='sotd-widget-next replace' href='#'>Next</a>");
					
					var today = new Date();
					var year = today.getFullYear();
					var month = today.getMonth() + 1;
					var day = today.getDate();
					
					if (month <= 9) month = "0" + month;
					if (day <= 9) day = "0" + day;
					
					var today_sort_field = /*year + "." +*/ month + "." + day;
					
					if (item.sort_field == today_sort_field) $next.addClass("disabled");
					
					if (page == npages) {
						if (pos == 0) $prev.addClass("disabled");
					} else if (pos == keys.length - 1) {
						$next.addClass("disabled");
					}
					
					$prev.bind("click", function prev () {
						var $this = $(this);
						
						if ($this.hasClass("disabled")) return false;
						
						$this.addClass("invisible");
						$this.siblings(".sotd-widget-next").addClass("invisible");
					
						var date = $element.data("date");
						var item = findItem(new Date(date.getTime() - 24 * 60 * 60 * 1000), -1);
						
						if (item) buildWidget(item);
						
						return false;
					});
					
					$next.bind("click", function next () {
						var $this = $(this);
					
						if ($this.hasClass("disabled")) return false;

						$this.addClass("invisible");
						$this.siblings(".sotd-widget-prev").addClass("invisible");

						var date = $element.data("date");
						var item = findItem(new Date(date.getTime() + 24 * 60 * 60 * 1000), 1);
						
						if (item) buildWidget(item);
						
						return false;
					});
					
					$element.append($prev);
					$element.append($next);
					$element.append("<a class='sotd-widget-archive' href='" + plugin.settings.archive_url + "'>Daily Archive</a>");

					$element.append("<a href='http://www.si.edu' class='sotd-widget-si-logo replace'>Smithsonian Institution</a>");
					
					$element.addClass("sotd-widget");
					
					// window.location = "#" + year + "-" + month + "-" + day;

					// $(window).on("hashchange", collectionDoneLoaded);
				}
			});
		}
		
		plugin.init = function () {
			plugin.settings = $.extend({}, defaults, options);
			
			$element.data("date", null);
			$element.data("year", null);
			$element.data("month", null);
			$element.data("day", null);
			
			$element.find(".sotd-widget-inner").after("<span class='sotd-widget-loading replace'>Loading</span>");
			
			getCollection();
		};
		
		plugin.init();
	};
	
	$.fn.sotd = function(options) {
        return this.each(function() {
            if (undefined == $(this).data('sotd')) {
                var plugin = new $.sotd(this, options);
                $(this).data('sotd', plugin);
            }
        });
    }
})(jQuery);
