<?php
/**
 * Get historical weather forecast for a post day
 *
 * @return array ($min, $max, $icon, $alt, $unit)
 *
 * @see https://stackoverflow.com/questions/3200984/where-can-i-find-historical-raw-weather-data
 * @uses https://darksky.net/dev/docs/time-machine
 * @requires https://github.com/joshuadavidnelson/wp-darksky
 * @requires https://gist.github.com/joshuadavidnelson/12e9915ad81d62a6991c
 * @requires https://github.com/erikflowers/weather-icons
 * @requires https://bitbucket.org/dotherightthing/wp-agm/
 *
 * @todo reveal gps field in media library UI, with prompt to add manual GPS is required
 * @todo toggle cache_enabled off if debugging enabled
 * @since 3.0.0
 */
function wpdtrt_weather() {

  $gps = do_shortcode("[wp-agm_featured_latlng]");
  $gps_array = explode(',', $gps);

  //if ( !empty($gps_array) ) { // fails
  if ( count($gps_array) < 2 ) {
    return;
  }

  $args = array(
    'api_key'       => '9a3c7a293c3a78a4169c1b71878b0a97',
    'latitude'      => $gps_array[0],
    'longitude'     => $gps_array[1],
    'time'          => get_the_date('U'),
    'cache_enabled' => false,
    'query'         => array(
      'units'       => 'si', // metric - French Système International d'Unités
      'exclude'     => 'flags'
    )
  );

  $forecast = new DarkSky\Weather_Icon_Forecast( $args );
  $min = 0;
  $max = 0;
  $icon = '';
  $summary = '';
  $unit = '';

  //wpdtrt_log('https://api.darksky.net/forecast/' . $args['api_key'] . '/' . $args['latitude'] . ',' . $args['longitude'] . ',' . $args['time']);

  // Get the day's historical forecast data
  $day = isset( $forecast->daily['data'] ) ? $forecast->daily['data'][0] : false;

  if ( $day ) {
    $min =  !empty( $day['temperatureMin'] ) ? intval( $day['temperatureMin'] ) : ''; // get_field('acf_temperature_min');
    $max =  !empty( $day['temperatureMax'] ) ? intval( $day['temperatureMax'] ) : ''; // get_field('acf_temperature_max');
    $icon = !empty( $day['icon'] ) ? $forecast->get_icon( esc_attr( $day['icon'] ) ) : ''; // get_entry_stats_weather($post_id)[0];
    $summary =  !empty( $day['summary'] ) ? esc_attr( $day['summary'] ) : ''; // get_entry_stats_weather($post_id)[1];
    $unit = '&deg;<abbr title="Centigrade">C</abbr>';
  }

  if ( $min && $max && $icon ) {
    return array(
      'min' => $min,
      'max' => $max,
      'icon' => $icon,
      'summary' => $summary,
      'unit' => $unit
    );
  }
  else {
    return array();
  }

}

?>