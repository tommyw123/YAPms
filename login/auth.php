<?
require_once '../../external/mapstore_pass.php';

function createUserDirectory() {
	$connection_id = ftp_connect('74.208.19.50');
	$login_result = ftp_login($connection_id, 'yapms', $mapstore_pass);

	if(ftp_mkdir($connection_id, './users/' . $userData['id'])) {
		echo 'created dir';
	} else {
		echo 'failed creating dir';
	}

	ftp_close($connection_id);
}

require_once "GoogleAPI/vendor/autoload.php";

if(isset($_POST['token'])) {
	$token = $_POST['token'];
	$client = new Google_Client(['client_id' => '406738305883-b9cbn6ge3i5a5fnn6perdbuvq1eu5go2.apps.googleusercontent.com']);
	$payload = $client->verifyIdToken($token);
	if($payload) {
		var_dump($payload);
		echo 'verify success';
		createUserDirectory();
	} else {
		echo 'verify error';
	}
} else {
	echo 'token not set';
}
?>