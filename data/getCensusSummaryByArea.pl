#!/usr/bin/perl

use Time::HiRes;
use Data::Dumper;

$start = [Time::HiRes::gettimeofday()];

$geocode = ($ARGV[0]||"E12000003"); #E12000003 - Yorkshire and the Humber
$geotype = "";


$lookupfile = "Census2011/OA/OA-lookup-sorted.csv";
%segments = (
	"age"=>{
		"type"=>"InFuse",
		"notes"=>"Go to http://infuse2011gf.ukdataservice.ac.uk/infusewizgeo.aspx add 'Output Areas and Small Areas' then in the next section choose 'Age' and then select all single year categories. Save the output under Census2011/OA/AGE_UNIT/",
		"file"=>"Census2011/OA/AGE_UNIT/Data_AGE_UNIT.csv",
		"options"=>{
			"rename"=>{
				"Age under 1"=>"Age 0",
				"Age 100 and over"=>"Age 100+",
				"Total Age"=>"total"
			},
			"group"=>{
				#"0-14"=>["Age 0","Age 1","Age 2","Age 3","Age 4","Age 5","Age 6","Age 7","Age 8","Age 9","Age 10","Age 11","Age 12","Age 13","Age 14"],
				"15-24"=>["Age 15","Age 16","Age 17","Age 18","Age 19","Age 20","Age 21","Age 22","Age 23","Age 24"],
				"25-34"=>["Age 25","Age 26","Age 27","Age 28","Age 29","Age 30","Age 31","Age 32","Age 33","Age 34"],
				"35-44"=>["Age 35","Age 36","Age 37","Age 38","Age 39","Age 40","Age 41","Age 42","Age 43","Age 44"],
				"45-54"=>["Age 45","Age 46","Age 47","Age 48","Age 49","Age 50","Age 51","Age 52","Age 53","Age 54"],
				"55-64"=>["Age 55","Age 56","Age 57","Age 58","Age 59","Age 60","Age 61","Age 62","Age 63","Age 64"],
				"65-69"=>["Age 65","Age 66","Age 67","Age 68","Age 69"],
				"70+"=>["Age 70","Age 71","Age 72","Age 73","Age 74","Age 75","Age 76","Age 77","Age 78","Age 79","Age 80","Age 81","Age 82","Age 83","Age 84","Age 85","Age 86","Age 87","Age 88","Age 89","Age 90","Age 91","Age 92","Age 93","Age 94","Age 95","Age 96","Age 97","Age 98","Age 99","Age 100+"],
				"total"=>["total"]
			}
		}
	},
	"carer"=>{
		"type"=>"InFuse",
		"notes"=>"Go to http://infuse2011gf.ukdataservice.ac.uk/infusewizgeo.aspx add 'Output Areas and Small Areas' then in the next section choose 'Care (unpaid), provision of' and then select all categories. Save the output under Census2011/OA/PRUNCA_UNIT/",
		"file"=>"Census2011/OA/PRUNCA_UNIT/Data_PRUNCA_UNIT.csv",
		"options"=>{
			"group"=>{
				"total"=>["All categories Provision of unpaid care"],
				"yes"=>["Provides 1 to 19 hours unpaid care a week","Provides 20 to 49 hours unpaid care a week","Provides 50 or more hours unpaid care a week"],
				"no"=>["Provides no unpaid care"]
			}
		}
	},
	"disability"=>{
		"type"=>"InFuse",
		"notes"=>"Go to http://infuse2011gf.ukdataservice.ac.uk/infusewizgeo.aspx add 'Output Areas and Small Areas' then in the next section choose 'Long-term health problem or disability' and then select all categories. Save the output under Census2011/OA/LLHPDI_UNIT/",
		"file"=>"Census2011/OA/LLHPDI_UNIT/Data_LLHPDI_UNIT.csv",
		"options"=>{
			"group"=>{
				"total"=>["Total Long-term health problem or disability"],
				"no"=>["Day-to-day activities not limited"],
				"yes"=>["Day-to-day activities limited a lot","Day-to-day activities limited a little"]
			}
		}
	},
	"ethnicity"=>{
		"type"=>"InFuse",
		"notes"=>"Go to http://infuse2011gf.ukdataservice.ac.uk/infusewizgeo.aspx add 'Output Areas and Small Areas' then in the next section choose 'Ethnic group [E][S][W]' and then select all categories. Save the output under Census2011/OA/ETHGRP_UNIT/",
		"file"=>"Census2011/OA/ETHGRP_UNIT/Data_ETHGRP_UNIT.csv",
		"options"=>{
			"group"=>{
				"asian"=>["asian_bangladeshi","asian_chinese","asian_indian","asian_pakistani","asian_other"],
				"black"=>["black_african","black_caribbean","black_other"],
				"mixed"=>["mixed_african","mixed_asian","mixed_caribbean","mixed_other"],
				"other"=>["other_arab","other_anyother"],
				"white"=>["white_british","white_irish","white_traveller","white_other"],
				"total"=>["total"]
			},
			"rename"=>{
				"Total Ethnic group"=>"total",
				"Asian/Asian British Pakistani"=>"asian_pakistani",
				"Asian/Asian British Chinese"=>"asian_chinese",
				"Asian/Asian British Bangladeshi"=>"asian_bangladeshi",
				"Asian/Asian British Indian"=>"asian_indian",
				"Asian/Asian British Other Asian"=>"asian_other",
				"Black/African/Caribbean/Black British African"=>"black_african",
				"Black/African/Caribbean/Black British Other Black"=>"black_other",
				"Black/African/Caribbean/Black British Caribbean"=>"black_caribbean",
				"Mixed/multiple ethnic group White and Black African"=>"mixed_african",
				"Mixed/multiple ethnic group White and Black Caribbean"=>"mixed_caribbean",
				"Mixed/multiple ethnic group White and Asian"=>"mixed_asian",
				"Mixed/multiple ethnic group Other Mixed"=>"mixed_other",
				"Other ethnic group Arab"=>"other_arab",
				"Other ethnic group Any other ethnic group"=>"other_anyother",
				"White English/Welsh/Scottish/Northern Irish/British"=>"white_british",
				"White Irish"=>"white_irish",
				"White Gypsy or Irish Traveller"=>"white_traveller",
				"White Other White"=>"white_other"
			}
		}
	},
	"gender"=>{
		"type"=>"NOMIS",
		"notes"=>"Go to https://www.nomisweb.co.uk/census/2011/ks601ew and select 'Query data'. Under 'Geography' select 'All' 2011 output areas. Under 'Sex' click 'Tick to select columns'. Under 'Format/layout' check 'Include area codes'. Then download the data (which will take some time).",
		"file"=>"Census2011/OA/KS601EW.csv",
		"options"=>{
			"rename"=>{
				"All persons"=>"total",
				"Males"=>"male",
				"Females"=>"female"
			},
			"group"=>{
				"female"=>["female"],
				"male"=>["male"],
				"total"=>["total"]
			}
		}
	},
	"religion"=>{
		"type"=>"InFuse",
		"notes"=>"Go to http://infuse2011gf.ukdataservice.ac.uk/infusewizgeo.aspx add 'Output Areas and Small Areas' then in the next section choose 'Religion [E][S][W]' and then select all categories. Save the output under Census2011/OA/RELIG_UNIT/",
		"file"=>"Census2011/OA/RELIG_UNIT/Data_RELIG_UNIT.csv",
		"options"=>{
			"group"=>{
				"buddhist"=>["Buddhist"],
				"christian"=>["Christian"],
				"hindu"=>["Hindu"],
				"jewish"=>["Jewish"],
				"muslim"=>["Muslim"],
				"no"=>["No religion"],
				"other"=>["Other religion"],
				"sikh"=>["Sikh"],
				"undisclosed"=>["Religion not stated"],
				"total"=>["Total Religion"]
			}
		}
	},
	#"seb"=>{
	#	"type"=>"InFuse",
	#	"notes"=>"Go to http://infuse2011gf.ukdataservice.ac.uk/infusewizgeo.aspx add 'Output Areas and Small Areas' then in the next section choose 'NS-SeC (National Statistics Socio-economic Classification)' and then select 'Age 16 and over' along with all the 'NS-SeC' categories. Save the output under Census2011/OA/AGE_NSSEC_UNIT/",
	#		"file"=>"Census2011/OA/AGE_NSSEC_UNIT/Data_AGE_NSSEC_UNIT.csv",
	#	"options"=>{
	#		"group"=>{
	#			"total"=>["total"],
	#			"professional"=>["1","2"],
	#			"intermediate"=>["3","4"],
	#			"lower"=>["5","6","7","8"]
	#		},
	#		"rename"=>{
	#			"Total NS-SeC (National Statistics Socio-economic Classification)"=>"total",
	#			"1. Higher managerial; administrative and professional occupations"=>"1",
	#			"2. Lower managerial; administrative and professional occupations"=>"2",
	#			"3. Intermediate occupations"=>"3",
	#			"4. Small employers and own account workers"=>"4",
	#			"5. Lower supervisory and technical occupations"=>"5",
	#			"6. Semi-routine occupations"=>"6",
	#			"7. Routine occupations"=>"7",
	#			"8. Never worked and long-term unemployed"=>"8"
	#		}
	#	}
	#},
	"seb"=>{
		"type"=>"NOMIS",
		"notes"=>"Go to https://www.nomisweb.co.uk/census/2011/qs611ew add 'Output Areas and Small Areas' then select 'Query data'. Under 'Geography' select 'All' 2011 output areas. Under 'Social grade' check all the boxes. In the 'Format/layout' check the 'Include codes' box. Save the output under Census2011/OA/QS611EW.csv",
		"file"=>"Census2011/OA/QS611EW.csv",
		"options"=>{
			"group"=>{
				"total"=>["total"],
				"professional"=>["AB"],
				"intermediate"=>["C1"],
				"lower"=>["C2","DE"]
			},
			"rename"=>{
				"Approximated social grade"=>"total",
				"Approximated social grade AB"=>"AB",
				"Approximated social grade C1"=>"C1",
				"Approximated social grade C2"=>"C2",
				"Approximated social grade DE"=>"DE"
			}
		}
	}#Alternate socio-economic data from NOMIS QS611EW https://en.wikipedia.org/wiki/NRS_social_grade
);

$ok = 1;
foreach $s (sort(keys(%segments))){
	if(!-e $segments{$s}{'file'}){
		print "ERROR: The $s data file $segments{$s}{'file'} doesn't appear to exist.\n$segments{$s}{'notes'}\n";
		exit;
	}
}





# Read in the lookup file
print "Reading lookup: $lookupfile\n";
open(FILE,$lookupfile);
#OA11CD,LAD20CD,LAD20NM,RGN20CD,RGN20NM,OA11CD2,LEP20CD1,LEP20NM1,LEP20CD2,LEP20NM2
#E00000001,E09000001,City of London,E12000007,London,E00000001,E37000051,London,,
$i = 0;
%OAs = ();
%RGNs = ();
%LADs = ();
%LEPS = ();
%LAD2RGN = ();
%LEP2RGN = ();
while(<FILE>){
	$line = $_;
	$line =~ s/[\n\r]//g;
	if($i==0){
		@header = split(/,(?=(?:[^\"]*\"[^\"]*\")*(?![^\"]*\"))/,$line);
	}else{
		@cols = split(/,(?=(?:[^\"]*\"[^\"]*\")*(?![^\"]*\"))/,$line);
		$oa = $cols[0];
		$lad = $cols[1];
		$rgn = $cols[3];
		$lep1 = $cols[6];
		$lep2 = $cols[8];
		$OAs{$oa} = {'LEP1'=>$lep1,'LEP2'=>$lep2,'LAD'=>$lad,'RGN'=>$rgn,'data'=>{}};
		if(!$LADs{$lad}){ $LADs{$lad} = {'name'=>$cols[2],'id'=>$lad,'n'=>0,'data'=>{}}; }
		$LADs{$lad}{'n'}++;
		if(!$RGNs{$rgn}){ $RGNs{$rgn} = {'name'=>$cols[4],'id'=>$rgn,'n'=>0,'data'=>{}}; }
		$RGNs{$rgn}{'n'}++;
		$LAD2RGN{$lad} = $rgn;

		if($lep1){
			if(!$LEPs{$lep1}){ $LEPs{$lep1} = {'name'=>$cols[7],'id'=>$lep1,'n'=>0,'data'=>{}}; }
			$LEPs{$lep1}{'n'}++;
			if(!$LEP2RGN{$lep1}){ $LEP2RGN{$lep1} = ["",""]; }
			$LEP2RGN{$lep1}[0] = $rgn;
		}
		if($lep2){
			if(!$LEPs{$lep2}){ $LEPs{$lep2} = {'name'=>$cols[9],'id'=>$lep2,'n'=>0,'data'=>{}}; }
			$LEPs{$lep2}{'n'}++;
			if(!$LEP2RGN{$lep2}){ $LEP2RGN{$lep2} = ["",""]; }
			$LEP2RGN{$lep2}[1] = $rgn;
		}
	}
	$i++;
}
close(FILE);


foreach $s (sort(keys(%segments))){
	if($segments{$s}{'type'} eq "InFuse"){
		parseInFuseData($s,$segments{$s}{'file'},$geocode,%{$segments{$s}{'options'}});
	}else{
		parseNOMISData($s,$segments{$s}{'file'},$geocode,%{$segments{$s}{'options'}});
	}
}


# For both LADs and RGNs we use the region totals from the ONS Annual Population Survey 2018
open(CSV,"ONS/ONS-annual-population-survey-sexuality-2018.csv");
$i = 0;
while(<CSV>){
	$line = $_;
	$line =~ s/[\n\r]//g;
	if($i == 0){
		@header = split(/,/,$line);
	}else{
		@cols = split(/,/,$line);
		$rgn = $cols[1];
		if($rgn){
			foreach $lad (keys(%LAD2RGN)){
				if($LAD2RGN{$lad} eq $rgn){
					$LADs{$lad}{'data'}{'sexuality'} = {'grouped'=>{'total'=>0,'undisclosed'=>0}};
					for($c = 2; $c < @cols; $c++){
						$LADs{$lad}{'data'}{'sexuality'}{'grouped'}{$header[$c]} = $cols[$c];
						$LADs{$lad}{'data'}{'sexuality'}{'grouped'}{'total'} += $cols[$c];
						
					}
				}
			}
			$RGNs{$rgn}{'data'}{'sexuality'} = {'grouped'=>{'total'=>0,'undisclosed'=>0}};
			for($c = 2; $c < @cols; $c++){
				$RGNs{$rgn}{'data'}{'sexuality'}{'grouped'}{$header[$c]} = $cols[$c];
				$RGNs{$rgn}{'data'}{'sexuality'}{'grouped'}{'total'} += $cols[$c];
			}
			foreach $lep (keys(%LEP2RGN)){
				if(!$LEPs{$lep}{'data'}{'sexuality'}){ $LEPs{$lep}{'data'}{'sexuality'} = {'grouped'=>{'total'=>0,'undisclosed'=>0}}; }
				$n = @{$LEP2RGN{$lep}};
				for($l = 0; $l < $n;$l++){
					if($LEP2RGN{$lep}[$l]){
						if($rgn eq $LEP2RGN{$lep}[$l]){
							for($c = 2; $c < @cols; $c++){
								$LEPs{$lep}{'data'}{'sexuality'}{'grouped'}{$header[$c]} = $cols[$c];
								$LEPs{$lep}{'data'}{'sexuality'}{'grouped'}{'total'} += $cols[$c];
							}
						}
					}
				}
			}
		}
	}
	$i++;
}
close(CSV);

print "Calculate totals for LADs and RGNs\n";
# Add up totals for LADs and RGNs
foreach $oa (sort(keys(%OAs))){
	$lad = $OAs{$oa}{'LAD'};
	$rgn = $OAs{$oa}{'RGN'};
	$lep1 = $OAs{$oa}{'LEP1'};
	$lep2 = $OAs{$oa}{'LEP2'};
	foreach $typ ((keys(%{$OAs{$oa}{'data'}}))){
		if(!$RGNs{$rgn}{'data'}{$typ}){ $RGNs{$rgn}{'data'}{$typ} = {}; }
		if(!$LADs{$lad}{'data'}{$typ}){ $LADs{$lad}{'data'}{$typ} = {}; }
		if($lep1){
			if(!$LEPs{$lep1}{'data'}{$typ}){ $LEPs{$lep1}{'data'}{$typ} = {}; }
		}
		if($lep2){
			if(!$LEPs{$lep2}{'data'}{$typ}){ $LEPs{$lep2}{'data'}{$typ} = {}; }
		}
		foreach $attr ((keys(%{$OAs{$oa}{'data'}{$typ}}))){
			if(!$RGNs{$rgn}{'data'}{$typ}{$attr}){ $RGNs{$rgn}{'data'}{$typ}{$attr} = {}; }
			if(!$LADs{$lad}{'data'}{$typ}{$attr}){ $LADs{$lad}{'data'}{$typ}{$attr} = {}; }
			if($lep1){
				if(!$LEPs{$lep1}{'data'}{$typ}{$attr}){ $LEPs{$lep1}{'data'}{$typ}{$attr} = {}; }
			}
			if($lep2){
				if(!$LEPs{$lep2}{'data'}{$typ}{$attr}){ $LEPs{$lep2}{'data'}{$typ}{$attr} = {}; }
			}
			foreach $prop ((keys(%{$OAs{$oa}{'data'}{$typ}{$attr}}))){
				if(!$RGNs{$rgn}{'data'}{$typ}{$attr}){ $RGNs{$rgn}{'data'}{$typ}{$attr}{$prop} = 0; }
				$RGNs{$rgn}{'data'}{$typ}{$attr}{$prop} += $OAs{$oa}{'data'}{$typ}{$attr}{$prop};
				if(!$LADs{$lad}{'data'}{$typ}{$attr}){ $LADs{$lad}{'data'}{$typ}{$attr}{$prop} = 0; }
				$LADs{$lad}{'data'}{$typ}{$attr}{$prop} += $OAs{$oa}{'data'}{$typ}{$attr}{$prop};
				if($lep1){
					if(!$LEPs{$lep1}{'data'}{$typ}{$attr}){ $LEPs{$lep1}{'data'}{$typ}{$attr}{$prop} = 0; }
					$LEPs{$lep1}{'data'}{$typ}{$attr}{$prop} += $OAs{$oa}{'data'}{$typ}{$attr}{$prop};
				}
				if($lep2){
					if(!$LEPs{$lep2}{'data'}{$typ}{$attr}){ $LEPs{$lep2}{'data'}{$typ}{$attr}{$prop} = 0; }
					$LEPs{$lep2}{'data'}{$typ}{$attr}{$prop} += $OAs{$oa}{'data'}{$typ}{$attr}{$prop};
				}
			}
		}
	}
}


if($RGNs{$geocode}){
	$json = encodeJSON(%{$RGNs{$geocode}});
}
if($LADs{$geocode}){
	$json = encodeJSON(%{$LADs{$geocode}});
}
if($LEPs{$geocode}){
	$json = encodeJSON(%{$LEPs{$geocode}});
}

print $json;

print "Saving to $geocode.json\n";
open(JSON,">","$geocode.json");
print JSON $json;
close(JSON);

$diff = Time::HiRes::tv_interval($start);
print "Took $diff seconds to run.\n";





##############################################################
sub encodeJSON {
	my ($str,$p,$a);
	my (%props) = @_;
	print "encodeJSON\n";
	$str = "{\n";
	$str .= "\t\"name\":\"$props{'name'}\",\n";
	$str .= "\t\"id\": \"$props{'id'}\",\n";
	$str .= "\t\"OAs\": $props{'n'},\n";
	$str .= "\t\"data\":{\n";
	$p = 0;
	foreach $prop (sort(keys(%{$props{'data'}}))){
		$str .= ($p == 0 ? "":",\n")."\t\t\"$prop\":{\n";
		$a = 0;
		foreach $attr (sort(keys(%{$props{'data'}{$prop}{'grouped'}}))){
			if($attr ne "total" && $attr ne "undisclosed"){
				$str .= ($a == 0 ? "":",\n")."\t\t\t\"$attr\": $props{'data'}{$prop}{'grouped'}{$attr}";
				$a++;
			}
		}
		if($props{'data'}{$prop}{'grouped'}{'undisclosed'}){
			$str .= ",\n\t\t\t\"undisclosed\": $props{'data'}{$prop}{'grouped'}{'undisclosed'}";
		}
		if($props{'data'}{$prop}{'grouped'}{'total'}){
			$str .= ",\n\t\t\t\"total\": $props{'data'}{$prop}{'grouped'}{'total'}";
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

sub parseInFuseData {
	my ($n,$line,@header,@header2,@keep,@cols,$c,$ok,$g,$j,$m);
	my ($typ, $file, $geo, %props) = @_;

	print "Reading $typ: $file\n";
	open(CSV,$file);
	$n = 0;
	# CDU_ID,GEO_CODE,GEO_LABEL,GEO_TYPE,GEO_TYP2,F52,F53,F54,F55,F56,F57,F58,F59,F60,F61,F62,F63,F64,F65,F66,F67,F68,F69,F70,F71,F72,F73,F74,F75,F76,F77,F78,F79,F80,F81,F82,F83,F84,F85,F86,F87,F88,F89,F90,F91,F92,F93,F94,F95,F96,F97,F98,F99,F100,F101,F102,F103,F104,F105,F167,F172,F837,F838,F839,F840,F841,F842,F843,F844,F845,F846,F847,F848,F849,F850,F851,F852,F853,F854,F855,F856,F857,F858,F859,F860,F861,F862,F863,F864,F865,F866,F867,F868,F869,F870,F871,F872,F873,F874,F875,F876,F877,F878,F879,F880,F881,F882,
	# ,,,,,Age : Age 47 - Unit : Persons,Age : Age 48 - Unit : Persons,Age : Age 49 - Unit : Persons,Age : Age 50 - Unit : Persons,Age : Age 51 - Unit : Persons,Age : Age 52 - Unit : Persons,Age : Age 53 - Unit : Persons,Age : Age 54 - Unit : Persons,Age : Age 55 - Unit : Persons,Age : Age 56 - Unit : Persons,Age : Age 57 - Unit : Persons,Age : Age 58 - Unit : Persons,Age : Age 59 - Unit : Persons,Age : Age 60 - Unit : Persons,Age : Age 61 - Unit : Persons,Age : Age 62 - Unit : Persons,Age : Age 63 - Unit : Persons,Age : Age 64 - Unit : Persons,Age : Age 65 - Unit : Persons,Age : Age 66 - Unit : Persons,Age : Age 67 - Unit : Persons,Age : Age 68 - Unit : Persons,Age : Age 69 - Unit : Persons,Age : Age 70 - Unit : Persons,Age : Age 71 - Unit : Persons,Age : Age 72 - Unit : Persons,Age : Age 73 - Unit : Persons,Age : Age 74 - Unit : Persons,Age : Age 75 - Unit : Persons,Age : Age 76 - Unit : Persons,Age : Age 77 - Unit : Persons,Age : Age 78 - Unit : Persons,Age : Age 79 - Unit : Persons,Age : Age 80 - Unit : Persons,Age : Age 81 - Unit : Persons,Age : Age 82 - Unit : Persons,Age : Age 83 - Unit : Persons,Age : Age 84 - Unit : Persons,Age : Age 85 - Unit : Persons,Age : Age 86 - Unit : Persons,Age : Age 87 - Unit : Persons,Age : Age 88 - Unit : Persons,Age : Age 89 - Unit : Persons,Age : Age 90 - Unit : Persons,Age : Age 91 - Unit : Persons,Age : Age 92 - Unit : Persons,Age : Age 93 - Unit : Persons,Age : Age 94 - Unit : Persons,Age : Age 95 - Unit : Persons,Age : Age 96 - Unit : Persons,Age : Age 97 - Unit : Persons,Age : Age 98 - Unit : Persons,Age : Age 99 - Unit : Persons,Age : Age 100 and over - Unit : Persons,Age : Total\ Age - Unit : Persons,Age : Age 15 - Unit : Persons,Age : Age under 1 - Unit : Persons,Age : Age 1 - Unit : Persons,Age : Age 2 - Unit : Persons,Age : Age 3 - Unit : Persons,Age : Age 4 - Unit : Persons,Age : Age 5 - Unit : Persons,Age : Age 6 - Unit : Persons,Age : Age 7 - Unit : Persons,Age : Age 8 - Unit : Persons,Age : Age 9 - Unit : Persons,Age : Age 10 - Unit : Persons,Age : Age 11 - Unit : Persons,Age : Age 12 - Unit : Persons,Age : Age 13 - Unit : Persons,Age : Age 14 - Unit : Persons,Age : Age 16 - Unit : Persons,Age : Age 17 - Unit : Persons,Age : Age 18 - Unit : Persons,Age : Age 19 - Unit : Persons,Age : Age 20 - Unit : Persons,Age : Age 21 - Unit : Persons,Age : Age 22 - Unit : Persons,Age : Age 23 - Unit : Persons,Age : Age 24 - Unit : Persons,Age : Age 25 - Unit : Persons,Age : Age 26 - Unit : Persons,Age : Age 27 - Unit : Persons,Age : Age 28 - Unit : Persons,Age : Age 29 - Unit : Persons,Age : Age 30 - Unit : Persons,Age : Age 31 - Unit : Persons,Age : Age 32 - Unit : Persons,Age : Age 33 - Unit : Persons,Age : Age 34 - Unit : Persons,Age : Age 35 - Unit : Persons,Age : Age 36 - Unit : Persons,Age : Age 37 - Unit : Persons,Age : Age 38 - Unit : Persons,Age : Age 39 - Unit : Persons,Age : Age 40 - Unit : Persons,Age : Age 41 - Unit : Persons,Age : Age 42 - Unit : Persons,Age : Age 43 - Unit : Persons,Age : Age 44 - Unit : Persons,Age : Age 45 - Unit : Persons,Age : Age 46 - Unit : Persons,
	# 60516,E00000001,E00000001,Output Areas and Small Areas,OASA,3,1,4,1,5,5,1,1,5,6,6,4,5,5,3,2,7,3,5,1,1,3,0,3,4,2,3,4,1,1,0,3,3,2,2,5,2,1,0,1,1,1,0,2,0,0,0,0,0,0,0,0,0,0,194,2,2,4,2,1,2,1,2,0,0,0,1,1,0,2,1,0,3,2,1,0,0,0,2,1,3,3,3,5,0,1,1,1,0,1,2,1,2,1,4,4,2,4,2,4,1,1,

	while(<CSV>){
		
		chomp;
		if($n == 0){
			@header = split(/,(?=(?:[^\"]*\"[^\"]*\")*(?![^\"]*\"))/,$_);
		}elsif($n == 1){
			@header2 = split(/,(?=(?:[^\"]*\"[^\"]*\")*(?![^\"]*\"))/,$_);
			for($c = 0; $c < @header; $c++){
				if($header[$c]=~ /^F[0-9]+$/){
					$keep[$c] = 1;
					$header2[$c] =~ s/^.* : (.*) - Unit : .*/$1/;
					$header2[$c] =~ s/\\+//g;
					if($props{'rename'}){
						if($props{'rename'}{$header2[$c]}){
							$header2[$c] = $props{'rename'}{$header2[$c]};
						}
					}
				}else{
					$keep[$c] = 0;
				}
			}
		}elsif($n >= 2){
			# As none of the InFuse files use escaped commas we can use a quicker split
			@cols = split(/,/,$_);
			$oa = $cols[1];
			if(!$OAs{$oa}){
				print "WARNING: No output area $oa exits for $csv.\n";
			}else{
				# We only need to process this if it is part of the region we want
				if(!$geo){ $ok = 1; }
				else{
					$ok = 0;
					if($OAs{$oa}{'LAD'} eq $geo){ $ok = 1; }
					if($OAs{$oa}{'RGN'} eq $geo){ $ok = 1; }
					if($OAs{$oa}{'LEP1'} eq $geo){ $ok = 1; }
					if($OAs{$oa}{'LEP2'} eq $geo){ $ok = 1; }
				}
				if($ok){
					$OAs{$oa}{'data'}{$typ} = {'raw'=>{},'grouped'=>{}};
					for($c = 0; $c < @header; $c++){
						if($keep[$c]){
							$OAs{$oa}{'data'}{$typ}{'raw'}{$header2[$c]} = $cols[$c];
						}
					}
					if($props{'group'}){
						foreach $g (keys(%{$props{'group'}})){
							if(!$OAs{$oa}{'data'}{$typ}{'grouped'}{$g}){ $OAs{$oa}{'data'}{$typ}{'grouped'}{$g} = 0; }
							$m = @{$props{'group'}{$g}};
							for($j = 0; $j < $m; $j++){
								$OAs{$oa}{'data'}{$typ}{'grouped'}{$g} += $OAs{$oa}{'data'}{$typ}{'raw'}{$props{'group'}{$g}[$j]};
							}
						}
					}
				}
			}
		}
		$n++;
	}
	close(CSV);
}


sub parseNOMISData {
	my ($n,$line,@header,@header2,@keep,@cols,$c,$ok,$head);
	my ($typ, $file, $geo, %props) = @_;

	print "Reading $typ: $file\n";
	open(CSV,$file);
	#"KS601EW to KS603EW - Economic activity by sex"
	#"ONS Crown Copyright Reserved [from Nomis on 21 April 2021]"
	#"Population :","All usual residents aged 16 to 74"
	#"Units      :","Persons"
	#"Date       :","2011"
	#"Rural Urban:","Total"
	#"Economic Activity:","All usual residents aged 16 to 74"
	#
	#"2011 output area","mnemonic","All persons","Males","Females"
	#
	#"E00000001","E00000001",148,80,68
	$n = 0;
	$head = 0;
	while(<CSV>){
		$line = $_;
		$line =~ s/[\n\r]//g;
		if($line =~ /^\"2011 output area\"/){
			@header = split(/,(?=(?:[^\"]*\"[^\"]*\")*(?![^\"]*\"))/,$line);
			for($c = 2; $c < @header; $c++){
				$header[$c] =~ s/(^\"|\"$)//g;
				if($props{'rename'}){
					if($props{'rename'}{$header[$c]}){
						$header[$c] = $props{'rename'}{$header[$c]};
					}
				}
			}
			$head = $n+2;
		}elsif($n >= $head){
			@cols = split(/,(?=(?:[^\"]*\"[^\"]*\")*(?![^\"]*\"))/,$line);
			$oa = $cols[0];
			$oa =~ s/(^\"|\"$)//g;
			if($oa){
				if(!$OAs{$oa}){
					#print "WARNING: Output area $oa doesn't exist in the lookup.\n";
				}else{
					if(!$OAs{$oa}{'data'}{$typ}){ $OAs{$oa}{'data'}{$typ} = {'raw'=>{}}; }
					for($c = 2; $c < @cols; $c++){
						$OAs{$oa}{'data'}{$typ}{'raw'}{$header[$c]} = $cols[$c];
					}
					# Group any properties
					if($props{'group'}){
						foreach $g (keys(%{$props{'group'}})){
							if(!$OAs{$oa}{'data'}{$typ}{'grouped'}{$g}){ $OAs{$oa}{'data'}{$typ}{'grouped'}{$g} = 0; }
							$m = @{$props{'group'}{$g}};
							for($j = 0; $j < $m; $j++){
								$OAs{$oa}{'data'}{$typ}{'grouped'}{$g} += $OAs{$oa}{'data'}{$typ}{'raw'}{$props{'group'}{$g}[$j]};
							}
						}
					}
					
					
				}
			}
		}
		$n++;
	}
	close(CSV);
}
