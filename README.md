sod
===

NMNH Species of the Day Widget and Archive

NMNH Species of the Day Widget and Archive are jQuery plugins. Both have 
been testing with jQuery 1.7.1, but any mostly recent version of jQuery 
should work. The plugins themseleves are built on the jQuery Plugin 
Boilerplate project (http://stefangabos.ro/jquery/jquery-plugin-boilerplate-revisited/). 

To use the plugins, you need to include both the JS and CSS in your document, eg

	<link rel="stylesheet" href="_css/SOTD.css" />
	<script src="_js/jquery.js"></script>
	<script src="_js/SOTD.js"></script>
	
or 
	<link rel="stylesheet" href="_css/SOTD.archive.css" />
	<script src="_js/jquery.js"></script>
	<script src="_js/SOTD.archive.js"></script>

Both should be invoked when the DOM is ready, either from $(document).ready() 
or $(window).load() handlers.  For example, 

	<script>
		$(document).ready(function () {
			$("#widget").sotd();
		});
	</script>

will replace the contents of the <div id="widget"> with the SOTD Widget.  Likewise, 

	<script>
		$(document).ready(function () {
			$("#archive").sotdarchive();
		});
	</script>
	
will replace the contents of the <div id="archive"> with the SOTD Archive.  See the
example widget.html and archive.html files for reference.

The SOTD Widget can utilize the Highslide JS library (http://highslide.com/) for
displaying images in an overlay.

Javascript Configuration
========================

The SOTD widget can accept an options object.  The default values are shown below:

	<script>
		$(document).ready(function () {
			$("#widget").sotd(
				collection_id: 10986,
				collection_url: "http://eol.org/api/collections/1.0/",
				pages_url: "http://eol.org/api/pages/1.0/",
				nominate_url: "http://eol.org/collections/10986/newsfeed",
				archive_url: "http://eol.org/collections/10986",
				timeout: 10000,
				cache_ttl: 604800
			});
		});
	</script>
	
collection_id == The collection ID inside EOL; 10986 is the current SOTD collection.
collection_url == The base URL to use for API calls for collections.   The should never need to be changed.
pages_url == The base URL to use for API calls for pages.   The should never need to be changed.
nominate_url == The URL for the nominate link inside the widget.
archive_url == The URL for the archive link inside the widget.
timeout == The number of milliseconds to wait for API calls before displaying an error message.
cache_ttl == The TTL (time-to-live) [in seconds] for calls made to the EOL API.

The SOTD archive can accept an options object.  The default values are shown below:

	<script>
		$(document).ready(function () {
			$("#archive").sotdarchive({
				collection_id: 10986,
				collection_url: "http://eol.org/api/collections/1.0/",
				pages_url: "http://eol.org/api/pages/1.0/",
				nominate_url: "http://eol.org/collections/10986/newsfeed",
				cache_ttl: 604800
			});
		});
	</script>

collection_id == The collection ID inside EOL; 10986 is the current SOTD collection.
collection_url == The base URL to use for API calls for collections.   The should never need to be changed.
pages_url == The base URL to use for API calls for pages.   The should never need to be changed.
nominate_url == The URL for the nominate link inside the widget.
cache_ttl == The TTL (time-to-live) [in seconds] for calls made to the EOL API.

SOTD Widget CSS Classes
=======================

All of the SOTD Widget CSS classes are prefixed with .sotd-widget to avoide namespace clashes
with existing projects.  Normal CSS techniques apply to customization.  The developer tools
included with Firefox and Google Chrome will aid greatly in adjusting values.

.sotd-widget == the base class for the widget
.sotd-widget-loading  == the loading indicator
.sotd-widget-error == the error message
.sotd-widget-inner == contains the actual species information
.sotd-widget-eol-logo == the EOL logo using image replacement
.sotd-widget-thumbnail == the thumbnail image
.sotd-widget-metadata  == the metadata block
.sotd-widget-common-name == the common name
.sotd-widget-scientific-name == the scientific name
.sotd-widget-common-name .latin, .sotd-widget-scientific-name .latin == latin versions
.sotd-widget-description == the description text
.sotd-widget-nominate == the nominate link
.sotd-widget-prev == the previous button using image replacement
.sotd-widget-next == the next button using image replacement
.sotd-widget-archive == the archive link
.sotd-widget-si-logo == the EOL logo using image replacement

SOTD Archive CSS Classes
========================

.sotd-archive == the whole archive
.sotd-archive-item == the card container
.sotd-archive-front == the front of the card
.sotd-archive-back == the back of the card
.sotd-archive-date == the date
.sotd-archive-common-name == the common name
.sotd-archive-scientific-name == the scientific name
.sotd-archive-common-name .latin, .sotd-archive-scientific-name .latin == latin versions
