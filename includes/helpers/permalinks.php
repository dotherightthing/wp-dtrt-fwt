<?php
/**
 * Permalink helpers
 *
 * @package DTRT Framework - Theme
 * @subpackage DTRT Framework - Theme Functions
 * @since 0.1.0
 * @version 0.1.0
 */

/**
 * Support %placeholder% in WordPress Permalinks settings
 * Use case: Taxonomies do not automatically appear in Custom Post type permalinks
 * Use case: Show Custom Field value in permalink
 * The placeholder must be added to the string
 * The placeholder must be translated from a placeholder to the taxonomy term value
 *
 * @param $permalink See WordPress function options
 * @param $post See WordPress function options
 * @param $leavename See WordPress function options
 *
 * @see http://shibashake.com/wordpress-theme/add-custom-taxonomy-tags-to-your-wordpress-permalinks
 * @see http://shibashake.com/wordpress-theme/custom-post-type-permalinks-part-2#conflict
 * @see https://stackoverflow.com/questions/7723457/wordpress-custom-type-permalink-containing-taxonomy-slug
 */
add_filter('post_link', 		'wpdtrt_permalink_placeholders', 10, 3);
add_filter('post_type_link', 	'wpdtrt_permalink_placeholders', 10, 3);

function wpdtrt_permalink_placeholders($permalink, $post, $leavename) {

	// Get post
	$post_id = $post->ID;

	// extract all %placeholders% from the permalink
	// https://regex101.com/
	preg_match_all('/(?<=\/%).+?(?=%\/)/', $permalink, $placeholders, PREG_OFFSET_CAPTURE);

	// placeholders in an array of taxonomy/term arrays
	foreach ( $placeholders[0] as $placeholder ) {

		$placeholder_name = $placeholder[0];

		// if taxonomy
		if ( taxonomy_exists( $placeholder_name ) ) {

			/**
			 * Get the taxonomy terms related to the current post object
			 * wp_get_object_terms() doesn't cache the results but does implement a sort order
			 * get_the_terms() does cache the results but doesn't implement a sort order
			 *
			 * If a post only belongs to one parent, one child and/or one grandchild, you can order the terms by term_id.
			 * It is widely accepted that the parent will have a lower numbered ID than the child and the child will have a * lower numbered ID than the grandchild
			 * @see https://wordpress.stackexchange.com/questions/172118/get-the-term-list-by-hierarchy-order
			 * This isn't true for me: East Asia is lower than China, but NZ is higher than Rainbow Road
			 *
			 * Returns Array of WP_Term objects on success
			 * Return false if there are no terms or the post does not exist
			 * Returns WP_Error on failure.
			 */
			$terms = get_the_terms(
				$post_id,
				$placeholder_name
			);

			//wpdtrt_log( $placeholder_name . ' - ' . gettype( $terms ) );

			if ( is_array( $terms ) ) {

				/**
				 * Sort terms into hierarchical order
				 *
				 * Has parent: $term->parent === n
				 * No parent: $term->parent === 0
				 * strnatcmp = Natural string comparison
				 *
				 * @see https://developer.wordpress.org/reference/functions/get_the_terms/
				 * @see https://wordpress.stackexchange.com/questions/172118/get-the-term-list-by-hierarchy-order
				 * @see https://stackoverflow.com/questions/1597736/how-to-sort-an-array-of-associative-arrays-by-value-of-a-given-key-in-php
				 * @see https://wpseek.com/function/_get_term_hierarchy/
				 * @see https://wordpress.stackexchange.com/questions/137926/sorting-attributes-order-when-using-get-the-terms
				 */
				uasort ( $terms , function ( $term_a, $term_b ) {
					return strnatcmp( $term_a->parent, $term_b->parent );
			    });

				/**
				 * Retrieve the slug value of the first custom taxonomy object linked to the current post.
				 * If no terms are retrieved, then replace our term tag with the fallback value.
				 * This prevents // in permalink
				 */
				$replacements = array();

				if ( !is_wp_error( $terms ) ) {
					foreach ( $terms as $term ) {
						if ( !empty( $term ) && is_object( $term ) ) {
							$replacements[] = $term->slug;
						}
					}

					$replacements = implode('/', $replacements);
				}

				/**
				 * Replace the %taxonomy% tag with our custom taxonomy slug.
				 */
				$permalink = str_replace( ( '%' . $placeholder_name . '%' ), $replacements, $permalink);
			}
		}
		// if custom field
		else if ( metadata_exists( 'post', $post_id, $placeholder_name ) ) {
			$replacement = get_post_meta( $post_id, $placeholder_name, true );
			$permalink = str_replace( ( '%' . $placeholder_name . '%' ), $replacement, $permalink);

			//wpdtrt_log( 'wpdtrt_permalink_placeholders = metadata_exists("post")' );
		}
		// if neither
		else {
			$replacement = 'no-' . $placeholder_name;
			$permalink = str_replace( ( '%' . $placeholder_name . '%' ), $replacement, $permalink);

			//$test = get_post_meta($post_id, 'wpdtrt_tourdates_cf_daynumber', true);
			//wpdtrt_log( 'wpdtrt_permalink_placeholders = no metadata_exists and wpdtrt_tourdates_cf_daynumber = ' . $test );
		}
	}

	return $permalink;
}

?>