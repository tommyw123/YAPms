<?php
include 'dblogin.php';

$content = file_get_contents('https://www.congress.gov/rss/presented-to-president.xml');

echo $content;

$xml = new SimpleXMLElement($content);

echo '<ul>';

foreach($xml->channel->item as $entry) {
	echo '<li><a href=' . $entry->link . ' title=' . $entry->title . '>'. $entry->title . '</a></li>' . $entry->description;

	$title = 'Presidential Signature: ' . $entry->title;
	$author = 'Congress';
	$snippet = $entry->description;
	$text = $entry->description;
	$published = strtotime($xml->channel->pubDate);
	$published = date('Y-m-d', $published);
	$source = $entry->link;
	$featured = false;

	$sql = 'insert into articles (title, author, published, upload, snippet, text, source, Featured) values (?,?,?,?,?,?,?,?)';

	echo '<br>';

	/*
	$stm $dbh->prepare($sql);

	if($stm->execute([$title, $author, $published, date("Y-m-d H:i:s"), $snippet, $text, $source, $featured])) {
		echo 'sql query success...<br>';
	} else {
		echo 'sql query failed...<br>';
	}
	 */

	echo $sql;
}

echo '<br> hellooo';

$sql = 'select * from articles';

$dbh->query($sql);
foreach($q as $row) {
	echo $row['title'] . ' aaaa <br>';
}


echo '</ul>';
?>