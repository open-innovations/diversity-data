# Data sources

Notes on sources for the demographic data. As much as possible we download data by Output Area (OA). We then use a [lookup for output area to LSOA, MSOA, Local Authority, and Region](https://geoportal.statistics.gov.uk/datasets/output-area-to-lower-layer-super-output-area-to-middle-layer-super-output-area-to-local-authority-district-december-2020-lookup-in-england-and-wales) from ONS (Open Government Licence) to sum the data by geographic area.
 

## Age

* Year: 2011
* Geography: OA
* Source: InFuse
* Notes: Go to http://infuse2011gf.ukdataservice.ac.uk/infusewizgeo.aspx add 'Output Areas and Small Areas' then in the next section choose 'Age' and then select all single year categories. Save the output under `Census2011/OA/AGE_UNIT/`
* Rename:
  - "Age under 1"=>"Age 0"
  - "Age 100 and over"=>"Age 100+"
  - "Total Age"=>"total"
* Group:
  -	"0-14" => ["Age 0","Age 1","Age 2","Age 3","Age 4","Age 5","Age 6","Age 7","Age 8","Age 9","Age 10","Age 11","Age 12","Age 13","Age 14"]
  -	"15-24"=>["Age 15","Age 16","Age 17","Age 18","Age 19","Age 20","Age 21","Age 22","Age 23","Age 24"]
  -	"25-34"=>["Age 25","Age 26","Age 27","Age 28","Age 29","Age 30","Age 31","Age 32","Age 33","Age 34"],
  -	"35-44"=>["Age 35","Age 36","Age 37","Age 38","Age 39","Age 40","Age 41","Age 42","Age 43","Age 44"],
  -	"45-54"=>["Age 45","Age 46","Age 47","Age 48","Age 49","Age 50","Age 51","Age 52","Age 53","Age 54"],
  -	"55-64"=>["Age 55","Age 56","Age 57","Age 58","Age 59","Age 60","Age 61","Age 62","Age 63","Age 64"],
  -	"65-69"=>["Age 65","Age 66","Age 67","Age 68","Age 69"],
  -	"70+"=>["Age 70","Age 71","Age 72","Age 73","Age 74","Age 75","Age 76","Age 77","Age 78","Age 79","Age 80","Age 81","Age 82","Age 83","Age 84","Age 85","Age 86","Age 87","Age 88","Age 89","Age 90","Age 91","Age 92","Age 93","Age 94","Age 95","Age 96","Age 97","Age 98","Age 99","Age 100+"],
  -	"total"=>["total"]
* Citation: Office for National Statistics ; National Records of Scotland ; Northern Ireland Statistics and Research Agency (2017): 2011 Census aggregate data. UK Data Service (Edition: February 2017). DOI: http://dx.doi.org/10.5257/census/aggregate-2011-2. This information is licensed under the terms of the [Open Government Licence](http://www.nationalarchives.gov.uk/doc/open-government-licence/version/2).


## Carer

* Year: 2011
* Geography: OA
* Source: InFuse
* Notes: Go to http://infuse2011gf.ukdataservice.ac.uk/infusewizgeo.aspx add 'Output Areas and Small Areas' then in the next section choose 'Care (unpaid), provision of' and then select all categories. Save the output under `Census2011/OA/PRUNCA_UNIT/`
* Group:
	 - "total"=>["All categories Provision of unpaid care"],
	 - "yes"=>["Provides 1 to 19 hours unpaid care a week","Provides 20 to 49 hours unpaid care a week","Provides 50 or more hours unpaid care a week"],
	 - "no"=>["Provides no unpaid care"]
* Citation: Office for National Statistics ; National Records of Scotland ; Northern Ireland Statistics and Research Agency (2017): 2011 Census aggregate data. UK Data Service (Edition: February 2017). DOI: http://dx.doi.org/10.5257/census/aggregate-2011-2. This information is licensed under the terms of the [Open Government Licence](http://www.nationalarchives.gov.uk/doc/open-government-licence/version/2).

## Disability

* Year: 2011
* Geography: OA
* Source: InFuse
* Notes: Go to http://infuse2011gf.ukdataservice.ac.uk/infusewizgeo.aspx add 'Output Areas and Small Areas' then in the next section choose 'Long-term health problem or disability' and then select all categories. Save the output under `Census2011/OA/LLHPDI_UNIT/`
* Group
  - "total"=>["Total Long-term health problem or disability"],
  - "no"=>["Day-to-day activities not limited"],
  - "yes"=>["Day-to-day activities limited a lot","Day-to-day activities limited a little"]
* Citation: Office for National Statistics ; National Records of Scotland ; Northern Ireland Statistics and Research Agency (2017): 2011 Census aggregate data. UK Data Service (Edition: February 2017). DOI: http://dx.doi.org/10.5257/census/aggregate-2011-2. This information is licensed under the terms of the [Open Government Licence](http://www.nationalarchives.gov.uk/doc/open-government-licence/version/2).

## Ethnicity

* Year: 2011
* Geography: OA
* Source: InFuse
* Notes: Go to http://infuse2011gf.ukdataservice.ac.uk/infusewizgeo.aspx add 'Output Areas and Small Areas' then in the next section choose 'Ethnic group [E][S][W]' and then select all categories. Save the output under `Census2011/OA/ETHGRP_UNIT/`
* Rename
  - "Total Ethnic group"=>"total",
  - "Asian/Asian British Pakistani"=>"asian_pakistani",
  - "Asian/Asian British Chinese"=>"asian_chinese",
  - "Asian/Asian British Bangladeshi"=>"asian_bangladeshi",
  - "Asian/Asian British Indian"=>"asian_indian",
  - "Asian/Asian British Other Asian"=>"asian_other",
  - "Black/African/Caribbean/Black British African"=>"black_african",
  - "Black/African/Caribbean/Black British Other Black"=>"black_other",
  - "Black/African/Caribbean/Black British Caribbean"=>"black_caribbean",
  - "Mixed/multiple ethnic group White and Black African"=>"mixed_african",
  - "Mixed/multiple ethnic group White and Black Caribbean"=>"mixed_caribbean",
  - "Mixed/multiple ethnic group White and Asian"=>"mixed_asian",
  - "Mixed/multiple ethnic group Other Mixed"=>"mixed_other",
  - "Other ethnic group Arab"=>"other_arab",
  - "Other ethnic group Any other ethnic group"=>"other_anyother",
  - "White English/Welsh/Scottish/Northern Irish/British"=>"white_british",
  - "White Irish"=>"white_irish",
  - "White Gypsy or Irish Traveller"=>"white_traveller",
  - "White Other White"=>"white_other"
* Group
  - "asian"=>["asian_bangladeshi","asian_chinese","asian_indian","asian_pakistani","asian_other"],
  - "black"=>["black_african","black_caribbean","black_other"],
  - "mixed"=>["mixed_african","mixed_asian","mixed_caribbean","mixed_other"],
  - "other"=>["other_arab","other_anyother"],
  - "white"=>["white_british","white_irish","white_traveller","white_other"],
  - "total"=>["total"]
* Citation: Office for National Statistics ; National Records of Scotland ; Northern Ireland Statistics and Research Agency (2017): 2011 Census aggregate data. UK Data Service (Edition: February 2017). DOI: http://dx.doi.org/10.5257/census/aggregate-2011-2. This information is licensed under the terms of the [Open Government Licence](http://www.nationalarchives.gov.uk/doc/open-government-licence/version/2).

## Gender

* Year: 2011
* Geography: OA
* Source: NOMIS
* Notes: Go to https://www.nomisweb.co.uk/census/2011/ks601ew and select 'Query data'. Under 'Geography' select 'All' 2011 output areas. Under 'Sex' click 'Tick to select columns'. Under 'Format/layout' check 'Include area codes'. Then download the data (which will take some time).
* Rename
  - "All persons"=>"total",
  - "Males"=>"male",
  - "Females"=>"female"
* Group
  - "female"=>["female"],
  - "male"=>["male"],
  - "total"=>["total"]

## Religion

* Year: 2011
* Geography: OA
* Source: InFuse
* Notes: Go to http://infuse2011gf.ukdataservice.ac.uk/infusewizgeo.aspx add 'Output Areas and Small Areas' then in the next section choose 'Religion [E][S][W]' and then select all categories. Save the output under `Census2011/OA/RELIG_UNIT/`
* Group
  - "buddhist"=>["Buddhist"],
  - "christian"=>["Christian"],
  - "hindu"=>["Hindu"],
  - "jewish"=>["Jewish"],
  - "muslim"=>["Muslim"],
  - "no"=>["No religion"],
  - "other"=>["Other religion"],
  - "sikh"=>["Sikh"],
  - "undisclosed"=>["Religion not stated"],
  - "total"=>["Total Religion"]
* Citation: Office for National Statistics ; National Records of Scotland ; Northern Ireland Statistics and Research Agency (2017): 2011 Census aggregate data. UK Data Service (Edition: February 2017). DOI: http://dx.doi.org/10.5257/census/aggregate-2011-2. This information is licensed under the terms of the [Open Government Licence](http://www.nationalarchives.gov.uk/doc/open-government-licence/version/2).

## Sexuality

* Year: 2018
* Geography: Region
* Source: ONS
* Notes: Go to https://www.ons.gov.uk/peoplepopulationandcommunity/culturalidentity/sexuality/datasets/sexualidentityuk and download the CSV. Extract the 2018 values (latest) and then rebuild the table so that sexuality totals are given in the columns with regions in rows.* Socio-economic background: NOMIS. Go to https://www.nomisweb.co.uk/census/2011/qs611ew add 'Output Areas and Small Areas' then select 'Query data'. Under 'Geography' select 'All' 2011 output areas. Under 'Social grade' check all the boxes. In the 'Format/layout' check the 'Include codes' box. Save the output under `Census2011/OA/QS611EW.csv`.
* Citation: ONS, [Open Government Licence v3](http://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/)

## Socio-economic background

* Year: 2011
* Source: NOMIS
* Notes: Go to https://www.nomisweb.co.uk/census/2011/qs611ew add 'Output Areas and Small Areas' then select 'Query data'. Under 'Geography' select 'All' 2011 output areas. Under 'Social grade' check all the boxes. In the 'Format/layout' check the 'Include codes' box. Save the output under `Census2011/OA/QS611EW.csv`.
* Rename:
  -	"Approximated social grade"=>"total",
  -	"Approximated social grade AB"=>"AB",
  -	"Approximated social grade C1"=>"C1",
  -	"Approximated social grade C2"=>"C2",
  -	"Approximated social grade DE"=>"DE"
* Group
  - "total"=>["total"],
  - "professional"=>["AB"],
  - "intermediate"=>["C1"],
  - "lower"=>["C2","DE"]
