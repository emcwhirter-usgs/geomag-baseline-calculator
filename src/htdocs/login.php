<?php

/**
 * login.php?returnto=URL&username&password
 *     Have user?      --> Y -->  Redirect
 *        ↓ N                        ↑ Y
 *     Authenticating  --> Y -->  Valid User?
 *                  ↓             ↓ N
 *                  ↓ N       Show error
 *                  ↓           ↓
 *                  Show login form
 */

// If not logged in, try
if (!isset($_SESSION['userid']) && isset($_POST['enter'])){
	if (!isset($_POST['uname']) || !isset($_POST['passwd'])) {
		$LOGIN_ERROR = "Email and Password are required fields";
		return;
	}

	$user = authenticate($_POST['uname'], $_POST['passwd']);
	if ($user == "") {
		$LOGIN_ERROR = '
			A portion of your login was incorrect, please try again.
			If you are unable to login you may retrieve your password by:
			<ul>
				<li>Emailing us at <a href="mailto:jmfee@usgs.gov"
						>jmfee@usgs.gov</a></li>
			</ul>
		';
		return;
	}

	$_SESSION['type'] = $user['userType'];
	$_SESSION['userid'] = $user['id'];
	$_SESSION['username'] = $user['user'];
	$_SESSION['email'] = $user['email'];
}

//reload session roles at beginning of each request
// TODO update this SQL to match actual database for Web Absolutes users
$_SESSION['roles'] = array();
if(isset($_SESSION['userid'])) {
	$roles_query = "
		SELECT
			r.name
		FROM
			adminRoles r,
			adminUserRoles ur
		WHERE
			ur.adminRoleId=r.id AND
			ur.adminUserId={$_SESSION['userid']}
	";

	$roles_rs = mysql_query($roles_query, $admin_db);
	if ($roles_rs && mysql_num_rows($roles_rs) != 0) {
		while ($role = mysql_fetch_assoc($roles_rs)) {
			array_push($_SESSION['roles'], $role['name']);
		}
	}
}


/**
* ROLE FUNCTIONS
**/

/*
Parameter $role is a string role name.
*/
function isUserInRole($role) {
	return (
			in_array("superUser", $_SESSION['roles']) ||
			in_array($role, $_SESSION['roles'])
			);
}

/*
Parameter $roles is an array of role names.
*/
function isUserInRoles($roles) {
	$r = true;

	foreach ($roles as $role) {
		if (!isUserInRole($role)) {
			$r = false;
			break;
		}
	}

	return($r);
}

/*
* If the user does not have this role,
* they are redirected to the admin home page.
*/
function requireUserInRole($role) {
	if(!isUserInRole($role)) {
		header('Location: /admin/');
	}
}

/*
* If the user does not have all the roles,
* they are redirected to the admin home page.
*/
function requireUserInRoles($roles) {
	if (!isUserInRoles($roles)) {
		header('Location: /admin/');
	}
}


/**
* AUTHENTICATION FUNCTIONS
**/

/*
	If it's a usgs user (has a usgs email address), authenticate using LDAP.
	Otherwise check password hash from database.
	Parameter $user can be the email address, or user id

	Returns a user struture on success, or "" on failure.
*/
function authenticate($username, $password) {
	$returnValue = false;

	$user = get_user($username);
	if ($user != "") {
		// AD first
		try {
			ad_authenticate($user['user'], $password);
			$returnValue = $user;
		} catch (Exception $e) { /* Ignore */ }

		// If AD failed and a local user password is set and the input password is
		// correct (matches the DB password); user has successfully authenticated.
		if (!$returnValue && $user['pass'] !== '' &&
				$user['pass'] == md5(stripslashes($password))) {
			$returnValue = $user;
		}
	}

	return $returnValue;
}


/*
	Retrieve a user from the database.
	Parameter $user can be the email address, or user id.

	Returns a user structure on success, or "" on failure.
*/
function get_user($username) {
	global $admin_db;
	$user = "";
	$userid = mysql_real_escape_string($username);

	$useridfield = 'user';
	if (strstr($username, '@')) { $useridfield = 'email'; }

	$query = "select * from adminUsers where {$useridfield}='{$userid}'";
	$rs = mysql_query($query, $admin_db);
	if ($rs && mysql_num_rows($rs) != 0) {
		$user = mysql_fetch_assoc($rs);

		$stamp = "update adminUsers set lastLogin='".date("Y-m-d")."' where user='{$user['user']}'";
		mysql_query($stamp, $admin_db);
	}

	return ($user);
}

?>
