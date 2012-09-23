<?php

class Driver
{
	public
		$debug              = false,
		$curlUserAgent      = 'Mozilla/5.0 (X11; Linux x86_64; rv:15.0) Gecko/20100101 Firefox/15.0.1',
		$curlFollowLocation = true,
		$curlTimeout        = 5,
		$curlMaxRedirects   = 3
		;

	protected
		$v8,
		$host,
		$url,
		$html,
		$headers = array()
		;

	/**
	 * Constructor
	 */
	public function __construct()
	{
		$this->v8 = new V8Js();
	}

	/**
	 * Analyze a website
	 * @param string $url
	 */
	public function analyze($url)
	{
		try {
			$this->load(array('wappalyzer.js', 'apps.js', 'driver.js'));

			$result = $this->curl($url);

			$json = json_encode(array(
				'host'    => $this->host,
				'url'     => $this->url,
				'html'    => $this->html,
				'headers' => $this->headers
				));

			return $this->v8->executeString('
				w.driver.debug = ' . ( $this->debug ? 'true' : 'false' ) . ';
				w.driver.data  = ' . $json . ';

				w.driver.init();
				');
		} catch ( V8JsException $e ) {
			throw new DriverException('JavaScript error: ' . $e->getMessage());
		}
	}

	/**
	 * Load and execute one or more JavaScript files
	 * @param mixed $files
	 */
	protected function load($files)
	{
		if ( !is_array($files) ) {
			$files = array($files);
		}

		foreach ( $files as $file ) {
			$this->v8->executeString(file_get_contents('js/' . $file), $file);
		}
	}

	/**
	 * Perform a cURL request
	 * @param string $url
	 */
	protected function curl($url)
	{
		$ch = curl_init($url);

		curl_setopt_array($ch, array(
			CURLOPT_SSL_VERIFYPEER => false,
			CURLOPT_HEADER         => true,
			CURLOPT_RETURNTRANSFER => true,
			CURLOPT_FOLLOWLOCATION => $this->curlFollowLocation,
			CURLOPT_MAXREDIRS      => $this->curlMaxRedirects,
			CURLOPT_TIMEOUT        => $this->curlTimeout,
			CURLOPT_USERAGENT      => $this->curlUserAgent
			));

		$response = curl_exec($ch);

		if ( curl_errno($ch) !== 0 ) {
			throw new DriverException('cURL error: ' . curl_error($ch));
		}

		$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

		if ( $httpCode != 200 ) {
			throw new DriverException('cURL request returned HTTP code ' . $httpCode);
		}

		$this->url  = curl_getinfo($ch, CURLINFO_EFFECTIVE_URL);

		$this->host = parse_url($url, PHP_URL_HOST);

		$headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);

		$this->html = substr($response, $headerSize);

		$lines = array_slice(explode("\r\n", trim(substr($response, 0, $headerSize))), 1);

		foreach ( $lines as $line ) {
			if ( strpos(trim($line), ': ') !== false ) {
				list($key, $value) = explode(': ', $line);

				$this->headers[$key] = $value;
			}
		}
	}
}
