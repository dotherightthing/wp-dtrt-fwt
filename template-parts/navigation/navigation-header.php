<?php
/**
 * Displays top navigation
 *
 * @package WPDTRT
 * @subpackage WPDTRT Templates
 * @since 0.1.0
 * @version 0.1.0
 */

?>
<nav role="navigation" aria-label="<?php esc_attr_e( 'Header Menu', 'wpdtrt' ); ?>">
	<?php
	/**
	 * Navigation menu
	 * wp_page_menu: 2.7.0+
	 * wp_nav_menu: 3.0.0+
	 */
	wp_nav_menu( array(
		/**
		 * Apply Appearance > Menus > Menu Structure
		 * otherwise fallback_cb is used
		 */
		'menu'            => 'header-menu',
		'container'       => 'div',
		'container_class' => '',
		'container_id'    => '',
		'menu_class'      => 'navigation',
		'menu_id'         => 'header-nav',
		'echo'            => true,
		/**
		* The wp_page_menu() is sorted alphabetically
		*/
		'fallback_cb'     => 'wp_page_menu',
		'before'          => '',
		'after'           => '',
		'link_before'     => '',
		'link_after'      => '',
		'items_wrap'      => '<ul id="%1$s" class="%2$s">%3$s</ul>',
		'item_spacing'    => 'preserve',
		'depth'           => 0,
		'walker'          => '',
		/**
		 * Theme location must be registered with register_nav_menu()
		 * in order to be selectable by the user.
		 */
		'theme_location'  => 'Header Menu',
	) );
	?>
</nav>
