#!/usr/bin/perl

use utf8;
use Data::Dumper;
use JSON::XS;
use POSIX qw(strftime);
use open qw/ :std :encoding(utf8) /; # To avoid "Wide character warning"

@dashboards = ({"index"=>"leeds-city-region/leeds.csv","combined"=>"leeds-city-region/combined.csv"});


# Read in the fields from the definition JSON file - available via %fields
getFields("diversity-definition.json");

$lastupdated = "<time datetime=\"".strftime("%F",gmtime())."\">".strftime("%A %d %B %Y %R",gmtime())."</time>";

# Add the replaced fields
foreach $field (keys(%fields)){
	if($fields{$field}{'replaces'}){
		$fields{$fields{$field}{'replaces'}} = {'replacedby'=>$field};
	}
	
}

@colorder = ("published","organisation","organisation_grouping","organisation_level","employees","link_to_dei_info");

# Loop over the dashboard array
for($d = 0; $d < @dashboards; $d++){

	# Get the file name
	$file = $dashboards[$d]{'index'};
	
	# If the file exists
	if(-e $file){
	
		# Read in the lines of the file
		open(FILE,$file);
		@lines = <FILE>;
		close(FILE);
		
		%data = ('fields'=>{},'rows'=>[]);
		$csv = "";

		# Loop over lines (ignore header line)
		for($i = 1; $i < @lines; $i++){

			# Remove new line characters from the line
			$lines[$i] =~ s/[\n\r]//g;

			# Get the name and URL
			($name,$url) = split(",",$lines[$i]);

			$cls = "";

			readOrganisationURL($url);

		}


		for($c = 0; $c < @colorder; $c++){
			$csv .= ($c > 0 ? ",":"").$colorder[$c];
		}
		foreach $field (sort(keys(%{$data{'fields'}}))){
			$ok = 1;
			for($c = 0; $c < @colorder; $c++){
				if($field eq $colorder[$c]){ $ok = 0; }
			}
			if($ok){
				$csv .= ",$field";
			}
		}
		$csv .= "\n";
		
		@rows = ();

		for($r = 0; $r < @{$data{'rows'}}; $r++){
			msg("ROW $r\t\n");

			$row = "";
			for($c = 0; $c < @colorder; $c++){
				$row .= ($c > 0 ? ",":"").$data{'rows'}[$r]{$colorder[$c]};
			}
			foreach $field (sort(keys(%{$data{'fields'}}))){
				$ok = 1;
				for($c = 0; $c < @colorder; $c++){
					if($field eq $colorder[$c]){ $ok = 0; }
				}
#				print "\t$field\t$ok\n";
				if($ok){
					$row .= ",$data{'rows'}[$r]{$field}";
				}
			}
			push(@rows,$row);
		}
		$csv .= join("\n",reverse(sort(@rows)));

		# Save combined results for this dashboard
		open(CSV,">",$dashboards[$d]{'combined'});
		print CSV $csv;
		close(CSV);

	}
}





#######################

sub msg {
	my $str = $_[0];
	my $dest = $_[1]||"STDOUT";
	
	my %colours = (
		'black'=>"\033[0;30m",
		'red'=>"\033[0;31m",
		'green'=>"\033[0;32m",
		'yellow'=>"\033[0;33m",
		'blue'=>"\033[0;34m",
		'magenta'=>"\033[0;35m",
		'cyan'=>"\033[0;36m",
		'white'=>"\033[0;37m",
		'none'=>"\033[0m"
	);
	foreach my $c (keys(%colours)){ $str =~ s/\< ?$c ?\>/$colours{$c}/g; }
	if($dest eq "STDERR"){
		print STDERR $str;
	}else{
		print STDOUT $str;
	}
}

sub error {
	my $str = $_[0];
	$str =~ s/(^[\t\s]*)/$1<red>ERROR:<none> /;
	msg($str,"STDERR");
}

sub warning {
	my $str = $_[0];
	$str =~ s/(^[\t\s]*)/$1<yellow>WARNING:<none> /;
	msg($str,"STDERR");
}

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
			if($rows{'properties'}[$p]{'replaces'}){
				$fields{$name}{'replaces'} = $rows{'properties'}[$p]{'replaces'};
			}
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
	my (@lines,$i,@cols,@head,$r,$c,@messages,%lookup,$id,$v,$t,$category,$higher,$n,@b,$bad);

	
	if($url){
		msg("Getting <cyan>$url<none>...\n");
		@lines = `wget -q --no-check-certificate -O- "$url"`;
	}else{
		warning("No URL provided\n");
		return;
	}

	$n = @lines;
	if($n == 0){
		warning("No data from <cyan>$url<none>.\n");
		return 0;
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

		$bad = 0;
		%row = ();

		# Split the row into columns
		(@cols) = split(/,(?=(?:[^\"]*\"[^\"]*\")*(?![^\"]*\"))/,$lines[$r]);

		%checksubtotal = ();
		for($c = 0; $c < @cols; $c++){
			$validcell = 1;
			$id = $head[$c];
			

			if($id && $fields{$id}){

				if($fields{$id}{'replacedby'}){ $id = $fields{$id}{'replacedby'}; }
				$row{$id} = $cols[$c]||"";
				$data{'fields'}{$id} = ($data{'fields'}{$id} ? $data{'fields'}{$id}+1 : 0);
			}else{
				warning("Bad col $id\n");
			}
		}

		push(@{$data{'rows'}},{%row});

	}

	return 0;
}