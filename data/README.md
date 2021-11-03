# Data sources

Notes on sources for the demographic data. As much as possible we download data by Output Area (OA). We then use a [lookup for output area to LSOA, MSOA, Local Authority, and Region](https://geoportal.statistics.gov.uk/datasets/output-area-to-lower-layer-super-output-area-to-middle-layer-super-output-area-to-local-authority-district-december-2020-lookup-in-england-and-wales) from ONS (Open Government Licence) to sum the data by geographic area.
 

## Age

* Year: 2011
* Geography: OA
* Source: InFuse
* Notes: Go to http://infuse2011gf.ukdataservice.ac.uk/infusewizgeo.aspx add 'Output Areas and Small Areas' then in the next section choose 'Age' and then select all single year categories. Save the output under Census2011/OA/AGE_UNIT/

## Carer

* Year: 2011
* Geography: OA
* Source: InFuse
* Notes: Go to http://infuse2011gf.ukdataservice.ac.uk/infusewizgeo.aspx add 'Output Areas and Small Areas' then in the next section choose 'Care (unpaid), provision of' and then select all categories. Save the output under Census2011/OA/PRUNCA_UNIT/

## Disability

* Year: 2011
* Geography: OA
* Source: InFuse
* Notes: Go to http://infuse2011gf.ukdataservice.ac.uk/infusewizgeo.aspx add 'Output Areas and Small Areas' then in the next section choose 'Long-term health problem or disability' and then select all categories. Save the output under Census2011/OA/LLHPDI_UNIT/

## Ethnicity

* Year: 2011
* Geography: OA
* Source: InFuse
* Notes: Go to http://infuse2011gf.ukdataservice.ac.uk/infusewizgeo.aspx add 'Output Areas and Small Areas' then in the next section choose 'Ethnic group [E][S][W]' and then select all categories. Save the output under Census2011/OA/ETHGRP_UNIT/

## Gender

* Year: 2011
* Geography: OA
* Source: NOMIS
* Notes: Go to https://www.nomisweb.co.uk/census/2011/ks601ew and select 'Query data'. Under 'Geography' select 'All' 2011 output areas. Under 'Sex' click 'Tick to select columns'. Under 'Format/layout' check 'Include area codes'. Then download the data (which will take some time).

## Religion

* Year: 2011
* Geography: OA
* Source: InFuse
* Notes: Go to http://infuse2011gf.ukdataservice.ac.uk/infusewizgeo.aspx add 'Output Areas and Small Areas' then in the next section choose 'Religion [E][S][W]' and then select all categories. Save the output under Census2011/OA/RELIG_UNIT/

## Sexuality

* Year: 2018
* Geography: Region
* Source: ONS
* Notes: Go to https://www.ons.gov.uk/peoplepopulationandcommunity/culturalidentity/sexuality/datasets/sexualidentityuk and download the CSV. Extract the 2018 values (latest) and then rebuild the table so that sexuality totals are given in the columns with regions in rows.* Socio-economic background: NOMIS. Go to https://www.nomisweb.co.uk/census/2011/qs611ew add 'Output Areas and Small Areas' then select 'Query data'. Under 'Geography' select 'All' 2011 output areas. Under 'Social grade' check all the boxes. In the 'Format/layout' check the 'Include codes' box. Save the output under Census2011/OA/QS611EW.csv
