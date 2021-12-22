#!/usr/bin/perl

use utf8;
use Data::Dumper;
use JSON::XS;
use POSIX qw(strftime);
use open qw/ :std :encoding(utf8) /; # To avoid "Wide character warning"

@dashboards = ("leeds-city-region/leeds.csv");


# Read in the fields from the definition JSON file - available via %fields
getFields("diversity-definition.json");

$lastupdated = "<time datetime=\"".strftime("%F",gmtime())."\">".strftime("%A %d %B %Y %R",gmtime())."</time>";

# Loop over the dashboard array
for($d = 0; $d < @dashboards; $d++){

	# Get the file name
	$file = $dashboards[$d];
	
	# Work out the corresponding validation results file
	$vfile = $file;
	$vfile =~ s/([^\/]*).csv/validation.html/;
	
	# If the file exists
	if(-e $file && -e $vfile){
	
		# Read in the lines of the file
		open(FILE,$file);
		@lines = <FILE>;
		close(FILE);

		# Read in the validation HTML template
		open(HTML,$vfile);
		@vlines = <HTML>;
		close(HTML);
		$vstr = join("",@vlines);
		
		# Replace newlines temporarily to aid pattern matching across lines
		$vstr =~ s/[\n\r]+/::NEWLINE::/g;

		$html = "\t<ul class=\"grid compact\">\n";
		# Loop over lines (ignore header line)
		for($i = 1; $i < @lines; $i++){

			# Remove new line characters from the line
			$lines[$i] =~ s/[\n\r]//g;

			# Get the name and URL
			($name,$url) = split(",",$lines[$i]);

			$cls = "";

			@messages = readOrganisationURL($url);

			$txtw = "";
			$txte = "";
			$txts = "";
			$nw = 0;
			$ne = 0;
			for($m = 0; $m < @messages; $m++){
				if($messages[$m]{'type'} eq "error"){
					$txte .= "<li>".$messages[$m]{'message'}."</li>";
					$ne++;
				}elsif($messages[$m]{'type'} eq "warning"){
					$txtw .= "<li>".$messages[$m]{'message'}."</li>";
					$nw++;
				}
			}


			if($txtw){ $cls = "WARNING"; $txtw = "<div class=\"WARNING padded block\"><h3>WARNINGS: $nw</h3><ul class=\"list\">".$txtw."</ul></div>"; }
			if($txte){ $cls = "ERROR"; $txte = "<div class=\"ERROR padded block\"><h3>ERRORS: $ne</h3><ul class=\"list\">".$txte."</ul></div>"; }
			if(!$cls){ $cls = "SUCCESS"; $txts = "VALID"; }

			# Make the list item
			$html .= "\t\t<li><div class=\"$cls\"><h2>$name</h2><a href=\"$url\">Source data</a> $txte$txtw$txts</div></li>\n";
		}
		$html .= "\t</ul>\n";

		# Replace the portion of the original file with the new HTML fragment
		$vstr =~ s/(\<\!-- Start validation --\>)(.*)(\<\!-- End validation --\>)/$1\n$html\n$3/gi;
		$vstr =~ s/(\<\!-- Start date --\>)(.*)(\<\!-- End date --\>)/$1$lastupdated$3/gi;

		# Put newlines back
		$vstr =~ s/::NEWLINE::/\n/g;

		# Save results
		open(HTML,">",$vfile);
		print HTML $vstr;
		close(HTML);
	}
}





#######################
sub getFields {
	
	my $file = $_[0];
	my (@lines,$str,$s);
	# Read in the JSON definition
	open(FILE,$file);
	@lines = <FILE>;
	close(FILE);
	$str = join("",@lines);
	%json = %{JSON::XS->new->decode($str)};


	for($s = 0; $s < @{$json{'sections'}}; $s++){
		makeRows($json{'sections'}[$s]{'key'},0,%{$json{'sections'}[$s]});
	}
	return;
}

sub makeRows {
	my ($key,$lvl,%rows) = @_;

	my ($ps,$p,$name);

	$ps = @{$rows{'properties'}};
	if($key eq "metadata"){
		$key = "";
	}

	for($p = 0; $p < $ps; $p++){
		if($rows{'properties'}[$p]{'key'}){
			$name = $key.($key ? "_":"").$rows{'properties'}[$p]{'key'};
			if(!$fields{$name}){ $fields{$name} = {}; }

			$fields{$name}{'min'} = $rows{'properties'}[$p]{'minimum'}||"";
			$fields{$name}{'max'} = $rows{'properties'}[$p]{'maximum'}||"";
			$fields{$name}{'pattern'} = $rows{'properties'}[$p]{'pattern'}||"";
			$fields{$name}{'patterndesc'} = $rows{'properties'}[$p]{'patterndesc'}||"";
			$fields{$name}{'required'} = ($rows{'properties'}[$p]{'required'} ? 1 : 0)||0;
			$fields{$name}{'type'} = $rows{'properties'}[$p]{'type'}||"";
			$fields{$name}{'id'} = $name;

			if($rows{'properties'}[$p]{'properties'}){
				makeRows($name,$lvl+1,%{$rows{'properties'}[$p]});
			}
		}
	}
	return;
}


sub readOrganisationURL {
	my $url = $_[0];
	my (@lines,$i,@cols,@head,$r,$c,@messages,%lookup,$id,$v,$t,$category,$higher,$n,@b);

	if($url){
		print "Getting $url...\n";
		@lines = `wget -q --no-check-certificate -O- "$url"`;
	}else{
		print "No URL provided\n";
		return;

		print "Using a dummy file at leeds-city-region/YWtest.csv\n";
		open(FILE,"leeds-city-region/YWtest.csv");
		@lines = <FILE>;
		close(FILE);
	}

	$lines[0] =~ s/^\N{BOM}//;   # Remove any BOM character
	for($r = 0; $r < @lines; $r++){
		$lines[$r] =~ s/[\n\r]//g;
	}
	(@head) = split(/,(?=(?:[^\"]*\"[^\"]*\")*(?![^\"]*\"))/,$lines[0]);
	foreach $id (keys(%fields)){
		$lookup{$id} = -1;
	}
	for($c = 0; $c < @head; $c++){
		$lookup{$head[$c]} = $c;
	}

	for($r = 1; $r < @lines; $r++){

		# Split the row into columns
		(@cols) = split(/,(?=(?:[^\"]*\"[^\"]*\")*(?![^\"]*\"))/,$lines[$r]);

		%checksubtotal = ();
		for($c = 0; $c < @cols; $c++){
			$validcell = 1;
			$id = $head[$c];

			$v = ($cols[$c]||"");


			if($v ne "" && $fields{$id}{'pattern'}){
				# Check if it validates
				if($v !~ /$fields{$id}{'pattern'}/){
					push(@messages,{'type'=>'error','row'=>$r,'field'=>$id,'message'=>'The value of <em>'.$v.'</em> for <code>'.$id.'</code> on line '.($r+1).' appears to be invalid - '.$fields{$id}{'patterndesc'}});
				}
			}
			if($fields{$id}{'min'} ne "" && $cols[$c] < $fields{$id}{'min'}){
				push(@messages,{'type'=>'error','row'=>$r,'field'=>$id,'message'=>'The value <em>$cols[$c]</em> for <code>$id</code> on line '.($r+1).' is smaller than '.$fields{$id}{'min'}});
			}
			if($fields{$id}{'max'} ne "" && $cols[$c] > $fields{$id}{'max'}){
				push(@messages,{'type'=>'error','row'=>$r,'field'=>$id,'message'=>'The value <em>$cols[$c]</em> for <code>$id</code> on line '.($r+1).' is larger than '.$fields{$id}{'max'}});
			}
		}

		# Reset sub total for this row
		%checksubtotal = ();
		foreach $id (sort(keys(%fields))){
			$c = $lookup{$id};
			if($fields{$id}{'required'}){
				if($c < 0 || ($c >= 0 && $cols[$c] eq "")){
					push(@messages,{'type'=>'error','row'=>$r,'field'=>$id,'message'=>'The required field <code>'.$id.'</code> appears to be missing on line '.($r+1)});
				}
			}
			if($c >= 0){
				# If this field is a number type 
				if($fields{$id}{'type'} == "number"){
					@b = split(/_/,$id);
					$n = @b;
					$category = pop(@b);
					$higher = join("_",@b);
					if($n > 2){
						if(!$checksubtotal[$higher]){
							$checksubtotal[$higher] = ('total'=>0,'sub'=>());
						}
						if($category ne "total" && $cols[$c]){
							$checksubtotal{$higher}{'total'} += $cols[$c]+0;
							push(@{$checksubtotal{$higher}{'sub'}},'<code>'.$id.'</code>');
						}
					}
				}
			}
		}

		foreach $category (sort(keys(%checksubtotal))){
			$c = $lookup{$category};
			if($cols[$c]){
				$t = $cols[$c]+0;
				if($checksubtotal{$category}{'total'} > $t){
					push(@messages,{'type'=>'warning','row'=>$r,'field'=>$category,'message'=>'The value for <code>'.$category.'</code> is <strong>'.$t.'</strong> but the sub-categories ('.join(", ",@{$checksubtotal{$category}{'sub'}}).') appear to add up to <strong>'.$checksubtotal{$category}{'total'}.'</strong> on line '.($r+1)});
				}
			}else{
				if($checksubtotal{$category}{'total'} > 0){
					push(@messages,{'type'=>'warning','row'=>$r,'field'=>$category,'message'=>'No value has been given for <code>'.$category.'</code> although the sub-categories ('.join(", ",@{$checksubtotal{$category}{'sub'}}).') appear to add up to <strong>'.$checksubtotal{$category}{'total'}.'</strong> on line '.($r+1)});
				}
			}
		}
	}
	
	return @messages;
}