<?php

/**
 * - Clear session
 * - Redirect (to login page)
 */

<?php

	//logout using url
	if( isset($_GET['logout']) ) {
		$_SESSION = array();
		session_destroy();
	}

?>
