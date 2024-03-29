#!/usr/bin/perl

use utf8;
use Data::Dumper;
use JSON::XS;
use open qw/ :std :encoding(utf8) /; # To avoid "Wide character warning"

$jfile = "diversity-definition.json";
$builder = "builder.html";
#$standard = "standard.html";

# Read in the JSON definition
open(FILE,$jfile);
@lines = <FILE>;
close(FILE);
$str = join("",@lines);
%json = %{JSON::XS->new->decode($str)};

# Read in the builder page
open(HTML,$builder);
@lines = <HTML>;
close(HTML);
$html = join("",@lines);
if($html =~ /(\t*)(<\!-- START GENERATED CODE -->)/){
	$indent = $1;
}

$output = "";


$output .= $indent."<div id=\"builder\">\n";
$output .= $indent."\t<div>\n";
$output .= $indent."\t\t<nav id=\"menu\">\n";
$output .= $indent."\t\t\t<ul>\n";
for($s = 0; $s < @{$json{'sections'}}; $s++){
	$output .= $indent."\t\t\t<li><a href=\"#$json{'sections'}[$s]{'key'}\" class=\"grey\">$json{'sections'}[$s]{'title'}</a></li>\n";
}
$output .= $indent."\t\t\t</ul>\n";
$output .= $indent."\t\t</nav>\n";
$output .= $indent."\t</div>\n";
$output .= $indent."\t<div>\n";
$level = 0;
for($s = 0; $s < @{$json{'sections'}}; $s++){
	print "$s - $json{'sections'}[$s]{'title'}\n";
	$output .= $indent."\t\t<section id=\"$json{'sections'}[$s]{'key'}\" class=\"grey\">\n";
	$output .= $indent."\t\t\t<div class=\"heading doublepadded\">\n";
	$output .= $indent."\t\t\t\t<h3>".$json{'sections'}[$s]{'title'}."</h3>\n";
	if($json{'sections'}[$s]{'description'}){
		$output .= $indent."\t\t\t\t<p>".$json{'sections'}[$s]{'description'}."</p>\n";
	}
	$output .= $indent."\t\t\t</div>\n";
	$output .= makeRows($json{'sections'}[$s]{'key'},$level,%{$json{'sections'}[$s]});
	$output .= $indent."\t\t\t<p class=\"totop doublepadded\"><a href=\"#top\">Back to top</a></p>";
	$output .= $indent."\t\t</section>\n";
}
$output .= $indent."\t</div>\n";
$output .= $indent."</div>\n";

# Update the builder page
$html =~ s/(<\!-- START GENERATED CODE -->[\n\r]+)(.*)([\n\r]+\t*<\!-- END GENERATED CODE -->)/$1$output$3/s;
$html =~ s/(<\!-- START VERSION -->[\n\r]*)(.*)([\n\r]*\t*<\!-- END VERSION -->)/$1$json{'version'}$3/s;

print "Save\n";
open(HTML,">",$builder);
print HTML $html;
close(HTML);


# Update the standard page
#open(HTML,$standard);
#@lines = <HTML>;
#close(HTML);
#$html = join("",@lines);
#$output =~ s/two-col/one-col/g;
#$output =~ s/\t+<div class="col">\n\t+<input [^\>]* \/>\n\t+<\/div>\n//g;
#$html =~ s/(<\!-- START GENERATED CODE -->[\n\r]+)(.*)([\n\r]+\t*<\!-- END GENERATED CODE -->)/$1$output$3/s;
#open(HTML,">",$standard);
#print HTML $html;
#close(HTML);




##########################

sub makeRows {
	my ($key,$lvl,%rows) = @_;
	my ($output,$required,$r,$p,$name,$ps,$cols,$input,$replaces,$pattern);
	$output = "";
	#$key = $rows{'key'};
	$ps = @{$rows{'properties'}};
	if($key eq "metadata"){
		$key = "";
	}

	for($p = 0; $p < $ps; $p++){
		$required = "";
		if($rows{'properties'}[$p]{'key'}){

			if($rows{'properties'}[$p]{'required'}){
				$required = " required=\"required\"";
			}
			$name = $key.($key ? "_":"").$rows{'properties'}[$p]{'key'};
			$cols = ($rows{'properties'}[$p]{'type'}) ? 2 : 1;
			$output .= $indent."\t\t\t<div class=\"row".($required ? " required":"")." doublepadded level-$lvl ".($cols==1 ? "one-col":"two-col")."\">\n";
			$output .= $indent."\t\t\t\t<div class=\"col\">\n";
			$output .= $indent."\t\t\t\t\t<h4><label for=\"$name\">$rows{'properties'}[$p]{'title'}</label> <code>$name</code></h4>\n";
			$output .= $indent."\t\t\t\t\t<p>$rows{'properties'}[$p]{'description'}</p>\n";
			if($rows{'properties'}[$p]{'patterndesc'}){
				$output .= $indent."\t\t\t\t\t<p class=\"pattern\">Format: $rows{'properties'}[$p]{'patterndesc'}</p>\n";
			}
			$output .= $indent."\t\t\t\t</div>\n";	# End column
			$input = "";
			$replaces = ($rows{'properties'}[$p]{'replaces'} ? " data-replaces=\"$rows{'properties'}[$p]{'replaces'}\"":"");

			if($rows{'properties'}[$p]{'type'} eq "date"){
				$input = $indent."\t\t\t\t\t<input type=\"date\" id=\"$name\"$replaces $required/>\n";
			}elsif($rows{'properties'}[$p]{'type'} eq "string"){
				$pattern = "";
				if($rows{'properties'}[$p]{'pattern'}){
					$pattern = " pattern=\"$rows{'properties'}[$p]{'pattern'}\"";
				}
				$input = $indent."\t\t\t\t\t<input type=\"text\" id=\"$name\" placeholder=\"e.g. $rows{'properties'}[$p]{'example'}\"$replaces$pattern$required />\n";
			}elsif($rows{'properties'}[$p]{'type'} eq "integer"){
				$range = "";
				if($rows{'properties'}[$p]{'minimum'} ne ""){
					#print "$s - $p - $rows{'properties'}[$p]{'minimum'}\n";
					$range .= " min=\"$rows{'properties'}[$p]{'minimum'}\"";
				}
				if($rows{'properties'}[$p]{'maximum'} ne ""){
					$range .= " max=\"$rows{'properties'}[$p]{'maximum'}\"";
				}
				$input = $indent."\t\t\t\t\t<input type=\"number\" id=\"$name\" placeholder=\"e.g. $rows{'properties'}[$p]{'example'}\"$replaces$range$required />\n";
			}
			
			if($input){
				$output .= $indent."\t\t\t\t<div class=\"col\">\n";
				$output .= $input;
				$output .= $indent."\t\t\t\t</div>\n";	# End column
			}
			$output .= $indent."\t\t\t</div>\n";
			if($rows{'properties'}[$p]{'properties'}){
				$output .= makeRows($name,$lvl+1,%{$rows{'properties'}[$p]});
				print "SUB $name\n\n";
			}
		}
	}
	return $output;
}