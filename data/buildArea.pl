#!/usr/bin/perl
# Code to create data suitable for the diversity dashboard for a particular geography using Census data
# Call with e.g.:
#   perl buildArea.pl "Census2021.json"
# where the argument is the config file to use

use utf8;
binmode STDOUT, 'utf8';
binmode STDERR, 'utf8';

use lib "./";	# Custom functions
use JSON::XS;
use Time::HiRes;
use Data::Dumper;
use open qw( :std :encoding(UTF-8) );


$start = [Time::HiRes::gettimeofday()];
my $cache = {};
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


$config = LoadJSON($ARGV[0]||"Census2021.json");
%segments = %{$config->{'segments'}};



$ok = 1;
foreach $s (sort(keys(%segments))){
	if(!-e $segments{$s}{'file'}){
		error("\tThe $s data file $segments{$s}{'file'} doesn't appear to exist.\n\t$segments{$s}{'notes'}\n");
		exit;
	}
}

$lookup = loadGeographies($config);

foreach $geocode (keys(%{$lookup})){
	msg("Geography: $geocode\n");
	$final = {'id'=>$geocode,'data'=>{},'name'=>$lookup->{$geocode}{'name'}};
	foreach $s (sort(keys(%segments))){

		# Count the number of geographies that went into this geography
		$n = keys(%{$lookup->{$geocode}{'geo'}{$segments{$s}{'options'}{'type'}}});
		if(!defined $final->{'count'}){ $final->{'count'} = {}; }
		if(!defined $final->{'count'}{$segments{$s}{'options'}{'type'}}){ $final->{'count'}{$segments{$s}{'options'}{'type'}} = $n; }

		# Get the data
		$final = parseData($s,$segments{$s},$geocode,$final)
	}
	$json = encodeJSON(%{$final});
	print $json;

	print "Saving to $geocode.json\n";
	open(JSON,">","$geocode.json");
	print JSON $json;
	close(JSON);
}

$diff = Time::HiRes::tv_interval($start);
print "Took $diff seconds to run.\n";





##############################################################

sub loadGeographies {
	my $config = shift;
	my $lookups = $config->{'lookup'};
	my ($fh,@lines,$i,$r,@cols,$headerlookup,@header,$c,@geos,$g,$g2,$geocol,$primary,$code,%types,$type,$lookup,@tcodes,$tcode,$t,$OA,$type2,$tcode2,$names,$geographies);

	for($c = 0; $c < @{$config->{'geographies'}}; $c++){
		$geographies->{$config->{'geographies'}[$c]} = 1;
	}

	$n = @{$lookups};

	$primary = {};
	$name = {};
	
	# First we want to load in data by primary
	for($i = 0; $i < $n; $i++){

		msg("\tLoading geography lookups from <cyan>$lookups->[$i]{'file'}<none>\n");
		open($fh,"<:utf8",$lookups->[$i]{'file'});
		@lines = <$fh>;
		close($fh);
		
		@geos = keys(%{$lookups->[$i]{'geographies'}});
		for($g = 0; $g < @geos; $g++){
			if($geos[$g] ne "OA"){ $types{$geos[$g]} = 1; }
		}


		for($r = 0; $r < @lines; $r++){
			$lines[$r] =~ s/[\n\r]//g;
			@cols = split(/,(?=(?:[^\"]*\"[^\"]*\")*(?![^\"]*\"))/,$lines[$r]);
			if($r == 0){
				for($c = 0; $c < @cols; $c++){
					$headerlookup->{$cols[$c]} = $c;
				}
				@header = @cols;
			}else{
				$code = $cols[$headerlookup->{"OA"}];
				if(!defined $primary->{$code}){ $primary->{$code} = {'type'=>"OA",'geo'=>{}}; }
				for($g = 0; $g < @geos; $g++){
					if(defined $headerlookup->{$lookups->[$i]{'geographies'}{$geos[$g]}{'code'}} && $geos[$g] ne "OA"){
						if(!defined $primary->{$code}{'geo'}{$geos[$g]}){
							$primary->{$code}{'geo'}{$geos[$g]} = {};
						}
						$primary->{$code}{'geo'}{$geos[$g]}{$cols[$headerlookup->{$lookups->[$i]{'geographies'}{$geos[$g]}{'code'}}]} = 1;
						if($lookups->[$i]{'geographies'}{$geos[$g]}{'name'}){
							$names->{$cols[$headerlookup->{$lookups->[$i]{'geographies'}{$geos[$g]}{'code'}}]} = $cols[$headerlookup->{ $lookups->[$i]{'geographies'}{$geos[$g]}{'name'} }];
						}
					}
				}
			}
		}
	}

	$lookup = {};
	@types = keys(%types);

	foreach $OA (keys(%{$primary})){
		#$lookup->{$OA} = $primary->{$OA};
		foreach $type (@types){
			# Check if we have this type
			if($primary->{$OA}{'geo'}{$type}){
				# Get the code for this type (as we should only have OAs we will only have one item in the array)
				foreach $tcode (keys(%{$primary->{$OA}{'geo'}{$type}})){
					# Only bother storing data for the user-required geography
					if($geographies->{$tcode}){
						if(!defined $lookup->{$tcode}){
							$lookup->{$tcode} = {'type'=>$type,'geo'=>{},'name'=>$names->{$tcode}};
						}
						if(!defined $lookup->{$tcode}{'geo'}{'OA'}){
							$lookup->{$tcode}{'geo'}{'OA'} = {};
						}
						$lookup->{$tcode}{'geo'}{'OA'}{$OA} = 1;
						# Now add the other areas
						foreach $type2 (keys(%{$primary->{$OA}{'geo'}})){
							if(!defined $lookup->{$tcode}{'geo'}{$type2}){
								$lookup->{$tcode}{'geo'}{$type2} = {};
							}
							foreach $tcode2 (keys(%{$primary->{$OA}{'geo'}{$type2}})){
								$lookup->{$tcode}{'geo'}{$type2}{$tcode2} = 1;
							}
						}
					}
				}
			}
		}
	}

	return $lookup;
}

sub LoadJSON {
	my (@files,$str,@lines,$json);
	my $file = $_[0];
	open(FILE,"<:utf8",$file);
	@lines = <FILE>;
	close(FILE);
	$str = (join("",@lines));
	if(!$str){ $str = "{}"; }
	eval {
		$json = JSON::XS->new->decode($str);
	};
	if($@){ warning("\tInvalid JSON.\n".$str); }
	return $json;
}

sub encodeJSON {
	my ($str,$p,$a,$prop);
	my (%props) = @_;
	print "encodeJSON\n";
	$props{'name'} =~ s/(^\"|\"$)//g;
	$str = "{\n";
	$str .= "\t\"name\":\"$props{'name'}\",\n";
	$str .= "\t\"id\": \"$props{'id'}\",\n";
	$str .= "\t\"counts\": {\n";
	$p = 0;
	foreach $prop (sort(keys(%{$props{'count'}}))){
		$str .= ($p==0 ? "":",\n")."\t\t\"$prop\": $props{'count'}{$prop}";
		$p++;
	}
	$str .= "\n\t},\n";
	$str .= "\t\"data\":{\n";
	$p = 0;
	foreach $prop (sort(keys(%{$props{'data'}}))){
		$str .= ($p == 0 ? "":",\n")."\t\t\"$prop\":{\n";
		$a = 0;
		foreach $attr (sort(keys(%{$props{'data'}{$prop}}))){
			if($attr ne "total" && $attr ne "undisclosed"){
				$str .= ($a == 0 ? "":",\n")."\t\t\t\"$attr\": $props{'data'}{$prop}{$attr}";
				$a++;
			}
		}
		if($props{'data'}{$prop}{'undisclosed'}){
			$str .= ",\n\t\t\t\"undisclosed\": $props{'data'}{$prop}{'undisclosed'}";
		}
		if($props{'data'}{$prop}{'total'}){
			$str .= ",\n\t\t\t\"total\": $props{'data'}{$prop}{'total'}";
		}
		$str .= "\n";
		$str .= "\t\t}";
		$p++;
	}
	$str .= "\n";
	$str .= "\t}\n";
	$str .= "}\n";
	
	return $str;
}

sub parseData {
	my $typ = shift;
	my $s = shift;
	my $geo = shift;
	my $output = shift;
	my ($n,$head,$line,@cols,@header,$headerlookup,$c,$data,$geocol,$code,@codes,$i,$group);
	
	# Set up an empty holder for this type
	if(!defined $output->{'data'}){ $output->{'data'} = {}; }
	if(!defined $output->{'data'}{$typ}){ $output->{'data'}{$typ} = {}; }

	if($s->{'type'} eq "NOMIS"){
		
		if(!defined $cache->{$s->{'file'}}){
			#"date","geography","geography code","Age: Total; measures: Value","Age: Aged 4 years and under; measures: Value","Age: Aged under 1 year; measures: Value","Age: Aged 1 year; measures: Value","Age: Aged 2 years; measures: Value","Age: Aged 3 years; measures: Value","Age: Aged 4 years; measures: Value","Age: Aged 5 to 9 years; measures: Value","Age: Aged 5 years; measures: Value","Age: Aged 6 years; measures: Value","Age: Aged 7 years; measures: Value","Age: Aged 8 years; measures: Value","Age: Aged 9 years; measures: Value","Age: Aged 10 to 15 years; measures: Value","Age: Aged 10 years; measures: Value","Age: Aged 11 years; measures: Value","Age: Aged 12 years; measures: Value","Age: Aged 13 years; measures: Value","Age: Aged 14 years; measures: Value","Age: Aged 15 years; measures: Value","Age: Aged 16 to 19 years; measures: Value","Age: Aged 16 years; measures: Value","Age: Aged 17 years; measures: Value","Age: Aged 18 years; measures: Value","Age: Aged 19 years; measures: Value","Age: Aged 20 to 24 years; measures: Value","Age: Aged 20 years; measures: Value","Age: Aged 21 years; measures: Value","Age: Aged 22 years; measures: Value","Age: Aged 23 years; measures: Value","Age: Aged 24 years; measures: Value","Age: Aged 25 to 34 years; measures: Value","Age: Aged 25 years; measures: Value","Age: Aged 26 years; measures: Value","Age: Aged 27 years; measures: Value","Age: Aged 28 years; measures: Value","Age: Aged 29 years; measures: Value","Age: Aged 30 years; measures: Value","Age: Aged 31 years; measures: Value","Age: Aged 32 years; measures: Value","Age: Aged 33 years; measures: Value","Age: Aged 34 years; measures: Value","Age: Aged 35 to 49 years; measures: Value","Age: Aged 35 years; measures: Value","Age: Aged 36 years; measures: Value","Age: Aged 37 years; measures: Value","Age: Aged 38 years; measures: Value","Age: Aged 39 years; measures: Value","Age: Aged 40 years; measures: Value","Age: Aged 41 years; measures: Value","Age: Aged 42 years; measures: Value","Age: Aged 43 years; measures: Value","Age: Aged 44 years; measures: Value","Age: Aged 45 years; measures: Value","Age: Aged 46 years; measures: Value","Age: Aged 47 years; measures: Value","Age: Aged 48 years; measures: Value","Age: Aged 49 years; measures: Value","Age: Aged 50 to 64 years; measures: Value","Age: Aged 50 years; measures: Value","Age: Aged 51 years; measures: Value","Age: Aged 52 years; measures: Value","Age: Aged 53 years; measures: Value","Age: Aged 54 years; measures: Value","Age: Aged 55 years; measures: Value","Age: Aged 56 years; measures: Value","Age: Aged 57 years; measures: Value","Age: Aged 58 years; measures: Value","Age: Aged 59 years; measures: Value","Age: Aged 60 years; measures: Value","Age: Aged 61 years; measures: Value","Age: Aged 62 years; measures: Value","Age: Aged 63 years; measures: Value","Age: Aged 64 years; measures: Value","Age: Aged 65 to 74 years; measures: Value","Age: Aged 65 years; measures: Value","Age: Aged 66 years; measures: Value","Age: Aged 67 years; measures: Value","Age: Aged 68 years; measures: Value","Age: Aged 69 years; measures: Value","Age: Aged 70 years; measures: Value","Age: Aged 71 years; measures: Value","Age: Aged 72 years; measures: Value","Age: Aged 73 years; measures: Value","Age: Aged 74 years; measures: Value","Age: Aged 75 to 84 years; measures: Value","Age: Aged 75 years; measures: Value","Age: Aged 76 years; measures: Value","Age: Aged 77 years; measures: Value","Age: Aged 78 years; measures: Value","Age: Aged 79 years; measures: Value","Age: Aged 80 years; measures: Value","Age: Aged 81 years; measures: Value","Age: Aged 82 years; measures: Value","Age: Aged 83 years; measures: Value","Age: Aged 84 years; measures: Value","Age: Aged 85 years and over; measures: Value","Age: Aged 85 years; measures: Value","Age: Aged 86 years; measures: Value","Age: Aged 87 years; measures: Value","Age: Aged 88 years; measures: Value","Age: Aged 89 years; measures: Value","Age: Aged 90 years; measures: Value","Age: Aged 91 years; measures: Value","Age: Aged 92 years; measures: Value","Age: Aged 93 years; measures: Value","Age: Aged 94 years; measures: Value","Age: Aged 95 years; measures: Value","Age: Aged 96 years; measures: Value","Age: Aged 97 years; measures: Value","Age: Aged 98 years; measures: Value","Age: Aged 99 years; measures: Value","Age: Aged 100 years and over; measures: Value"
			#"2021","Hartlepool 001","E02002483",10242,568,107,119,108,101,133,665,146,111,125,142,141,832,153,129,150,130,120,150,423,131,128,92,72,559,95,116,103,106,139,1324,121,128,114,147,139,129,133,149,136,128,2007,116,152,137,135,140,150,159,108,122,124,121,118,114,146,165,2057,159,156,167,146,138,150,146,141,144,120,148,110,137,108,87,1010,99,112,101,92,104,91,108,96,110,97,590,76,76,54,53,55,50,71,48,63,44,207,34,31,34,28,26,20,7,11,3,7,2,2,0,0,2,0
			msg("\tReading <yellow>$typ<none> from <cyan>$s->{'file'}<none>\n");
			open(CSV,$s->{'file'});
			$n = 0;
			$head = 0;
			while(<CSV>){
				$line = $_;
				$line =~ s/[\n\r]//g;
				@cols = split(/,(?=(?:[^\"]*\"[^\"]*\")*(?![^\"]*\"))/,$line);
				for($c = 0; $c < @cols; $c++){ $cols[$c] =~ s/(^\"|\"$)//g; }
				if($n == 0){
					@header = @cols;
					for($c = 0; $c < @cols; $c++){
						$headerlookup->{$cols[$c]} = $c;
					}
				}else{
					$geocol = $headerlookup->{$s->{'options'}{'column'}};
					$code = $cols[$geocol];
					$data->{$code} = {};
					for($c = 0; $c < @cols; $c++){
						if($c != $geocol){
							$data->{$code}{$header[$c]} = $cols[$c];
						}
					}				
				}
				$n++;
			}
			close(CSV);
			$cache->{$s->{'file'}} = $data;
		}

	}else{
		warning("\tUnable to parse type $s->{'type'}\n");
	}

	# Get the cached data;
	$data = $cache->{$s->{'file'}};

	# Now process the data
	@codes = keys(%{$lookup->{$geo}{'geo'}{$s->{'options'}{'type'}}});
	# Loop over the valid codes for the required geography type
	for($i = 0; $i < @codes; $i++){
		$code = $codes[$i];
		foreach $group (keys(%{$s->{'options'}{'group'}})){
			if(!defined $output->{'data'}{$typ}{$group}){
				$output->{'data'}{$typ}{$group} = 0;
			}
			@cols = @{$s->{'options'}{'group'}{$group}};
			for($c = 0; $c < @cols; $c++){
				$output->{'data'}{$typ}{$group} += $data->{$code}{$s->{'options'}{'group'}{$group}[$c]};
			}
		}
	}
	return $output;
}


sub msg {
	my $str = $_[0];
	my $dest = $_[1]||STDOUT;
	foreach my $c (keys(%colours)){ $str =~ s/\< ?$c ?\>/$colours{$c}/g; }
	print $dest $str;
}

sub error {
	my $str = $_[0];
	$str =~ s/(^[\t\s]*)/$1<red>ERROR:<none> /;
	msg($str,STDERR);
}

sub warning {
	my $str = $_[0];
	$str =~ s/(^[\t\s]*)/$1$colours{'yellow'}WARNING:$colours{'none'} /;
	msg($str,STDERR);
}