<?php
/**
 * The template for displaying a widget-ready sidebar
 * The Theme should be widgetized as fully as possible. Any area in the layout that works like a widget
 * (tag cloud, blogroll, list of categories) or could accept widgets (sidebar) should allow widgets.
 * Content that appears in widgetized areas by default (hard-coded into the sidebar, for example)
 * should disappear when widgets are enabled from Appearance > Widgets.
 *
 * @package WPDTRT
 * @since 0.1.0
 * @see https://codex.wordpress.org/Theme_Development
 */

?>
<?php if ( ! function_exists( 'dynamic_sidebar' ) || ! dynamic_sidebar() ) : ?>
	<!-- content -->
<?php endif; ?>
