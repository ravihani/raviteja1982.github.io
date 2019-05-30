'use strict';

// Wrap everything in an anonymous function to avoid polluting the global namespace
(function () {
  let unregisterHandlerFunctions = [];

  $(document).ready(function () {
    tableau.extensions.initializeAsync().then(function () {
      //fetchFilters();
    
      
    $('#loading').addClass('show');
    // To get filter info, first get the dashboard.
    const dashboard = tableau.extensions.dashboardContent.dashboard;
    const worksheets = tableau.extensions.dashboardContent.dashboard.worksheets;
    //var tgt = document.getElementById("divData");
    
    var options = {
              maxRows: 10, // Max rows to return. Use 0 to return all rows
              ignoreAliases: false,
              ignoreSelection: true,
              includeAllColumns: false
          };

var counter =1;
var inside=1;
 // dashboard.getSummaryDataAsync().then(function(res){

// $("#divData").append("<h4>Underlying Data:</h4><hr/>");
   // $("#divData").append( "<p>"+ JSON.stringify(res.data) + "</p>");

 // });

worksheets.forEach(function (worksheet) {
  //  process each worksheet...
  
 
 	  $('#loading').addClass('show');
	  
	   // get the summary data for the sheet
 worksheet.getSummaryDataAsync().then(
  dataTable => {
    // let field = dataTable.columns.find(column => column.fieldName === "State");
    // let list = [];
    // for (let row of dataTable.data) {
      // list.push(row[field.index].value);
    // }
    // let values = list.filter((el, i, arr) => arr.indexOf(el) === i);
    // console.log(values);
	  $("#divData").append("<h3>" + worksheet.name + "</h3><hr/>");
		$("#divData").append(JSON.stringify(dataTable.data));
  }, function (err) {
    // called on any error, such as when the extension 
    // doesn’t have full data permission
    $("#divData").append("Error: No permissions: " + err );
});
	
	
  $('#loading').addClass('hide');
  
  
   
   

});




    // dashboard.worksheets.forEach(function (worksheet) {
    //   //filterFetchPromises.push(worksheet.getFiltersAsync());
    //     $("#divData").append("Counter: " + (counter++) + "<br/>");

    //       worksheet.getUnderlyingDataAsync(options).then(function(res){
    //         $("#divData").append("Inside Worksheet: " + (inside++) + "<br/>");
    //         $("#divData").append("Result: " + (res.rows.length) + "<br/>");
    //         $("#divData").append("<h4>Underlying Data:</h4><p>" + JSON.stringify(res.getData()) + "</p>");

    // });


    //   // Add filter event to each worksheet.  AddEventListener returns a function that will
    //   // remove the event listener when called.
    //   //let unregisterHandlerFunction = worksheet.addEventListener(tableau.TableauEventType.FilterChanged, filterChangedHandler);
    //   //unregisterHandlerFunctions.push(unregisterHandlerFunction);
    // });
  


      // Add button handlers for clearing filters.
     // $('#clear').click(clearAllFilters);
    }, function (err) {
      $("#divData").append("Error: " + err.toString() + "<br/>");
      // Something went wrong in initialization.
      console.log('Error while Initializing: ' + err.toString());
    });
  });


function filterChangedHandler(){

}

  function fetchFilters () {
    // While performing async task, show loading message to user.
    $('#loading').addClass('show');

    // Whenever we restore the filters table, remove all save handling functions,
    // since we add them back later in this function.
    unregisterHandlerFunctions.forEach(function (unregisterHandlerFunction) {
      unregisterHandlerFunction();
    });

    // Since filter info is attached to the worksheet, we will perform
    // one async call per worksheet to get every filter used in this
    // dashboard.  This demonstrates the use of Promise.all to combine
    // promises together and wait for each of them to resolve.
    let filterFetchPromises = [];

    // List of all filters in a dashboard.
    let dashboardfilters = [];

    // To get filter info, first get the dashboard.
    const dashboard = tableau.extensions.dashboardContent.dashboard;

    // Then loop through each worksheet and get its filters, save promise for later.
    dashboard.worksheets.forEach(function (worksheet) {
      filterFetchPromises.push(worksheet.getFiltersAsync());

      // Add filter event to each worksheet.  AddEventListener returns a function that will
      // remove the event listener when called.
      let unregisterHandlerFunction = worksheet.addEventListener(tableau.TableauEventType.FilterChanged, filterChangedHandler);
      unregisterHandlerFunctions.push(unregisterHandlerFunction);
    });

    // Now, we call every filter fetch promise, and wait for all the results
    // to finish before displaying the results to the user.
    Promise.all(filterFetchPromises).then(function (fetchResults) {
      fetchResults.forEach(function (filtersForWorksheet) {
        filtersForWorksheet.forEach(function (filter) {
          dashboardfilters.push(filter);
        });
      });

      buildFiltersTable(dashboardfilters);
    });
  }

  // This is a handling function that is called anytime a filter is changed in Tableau.
  // function filterChangedHandler (filterEvent) {
    // // Just reconstruct the filters table whenever a filter changes.
    // // This could be optimized to add/remove only the different filters.
    // fetchFilters();
  // }

  // Constructs UI that displays all the dataSources in this dashboard
  // given a mapping from dataSourceId to dataSource objects.
  function buildFiltersTable (filters) {
    // Clear the table first.
    $('#filtersTable > tbody tr').remove();
    const filtersTable = $('#filtersTable > tbody')[0];

    filters.forEach(function (filter) {
      let newRow = filtersTable.insertRow(filtersTable.rows.length);
      let nameCell = newRow.insertCell(0);
      let worksheetCell = newRow.insertCell(1);
      let typeCell = newRow.insertCell(2);
      let valuesCell = newRow.insertCell(3);

      const valueStr = getFilterValues(filter);

      nameCell.innerHTML = filter.fieldName;
      worksheetCell.innerHTML = filter.worksheetName;
      typeCell.innerHTML = filter.filterType;
      valuesCell.innerHTML = valueStr;
    });

    updateUIState(Object.keys(filters).length > 0);
  }

  // This returns a string representation of the values a filter is set to.
  // Depending on the type of filter, this string will take a different form.
  function getFilterValues (filter) {
    let filterValues = '';

    switch (filter.filterType) {
      case 'categorical':
        filter.appliedValues.forEach(function (value) {
          filterValues += value.formattedValue + ', ';
        });
        break;
      case 'range':
        // A range filter can have a min and/or a max.
        if (filter.minValue) {
          filterValues += 'min: ' + filter.minValue.formattedValue + ', ';
        }

        if (filter.maxValue) {
          filterValues += 'min: ' + filter.maxValue.formattedValue + ', ';
        }
        break;
      case 'relative-date':
        filterValues += 'Period: ' + filter.periodType + ', ';
        filterValues += 'RangeN: ' + filter.rangeN + ', ';
        filterValues += 'Range Type: ' + filter.rangeType + ', ';
        break;
      default:
    }

    // Cut off the trailing ", "
    return filterValues.slice(0, -2);
  }

  // This function removes all filters from a dashboard.
  function clearAllFilters () {
    // While performing async task, show loading message to user.
    $('#loading').removeClass('hidden').addClass('show');
    $('#filtersTable').removeClass('show').addClass('hidden');

    const dashboard = tableau.extensions.dashboardContent.dashboard;

    dashboard.worksheets.forEach(function (worksheet) {
      worksheet.getFiltersAsync().then(function (filtersForWorksheet) {
        let filterClearPromises = [];

        filtersForWorksheet.forEach(function (filter) {
          filterClearPromises.push(worksheet.clearFilterAsync(filter.fieldName));
        });

        // Same pattern as in fetchFilters, wait until all promises have finished
        // before updating the UI state.
        Promise.all(filterClearPromises).then(function () {
          updateUIState(false);
        });
      });
    });
  }

  // This helper updates the UI depending on whether or not there are filters
  // that exist in the dashboard.  Accepts a boolean.
  function updateUIState (filtersExist) {
    $('#loading').addClass('hidden');
    if (filtersExist) {
      $('#filtersTable').removeClass('hidden').addClass('show');
      $('#noFiltersWarning').removeClass('show').addClass('hidden');
    } else {
      $('#noFiltersWarning').removeClass('hidden').addClass('show');
      $('#filtersTable').removeClass('show').addClass('hidden');
    }
  }


  function getUnderlyingData(){

    $('#loading').addClass('show');
    // To get filter info, first get the dashboard.
    const dashboard = tableau.extensions.dashboardContent.dashboard;
    const worksheets = dashboard.worksheets;
    var tgt = document.getElementById("filtersTable");

    dashboard.worksheets.forEach(function (worksheet) {
      //filterFetchPromises.push(worksheet.getFiltersAsync());

  tgt.innerHTML += "<h4>" + worksheet.worksheetName + "</h4>";

      // Add filter event to each worksheet.  AddEventListener returns a function that will
      // remove the event listener when called.
      //let unregisterHandlerFunction = worksheet.addEventListener(tableau.TableauEventType.FilterChanged, filterChangedHandler);
      //unregisterHandlerFunctions.push(unregisterHandlerFunction);
    });


//     sheet = viz.getWorkbook().getActiveSheet().getWorksheets().get("Storm Map Sheet");
// // If the active sheet is not a dashboard, then you can just enter:
// // viz.getWorkbook().getActiveSheet();
//     options = {
//         maxRows: 10, // Max rows to return. Use 0 to return all rows
//         ignoreAliases: false,
//         ignoreSelection: true,
//         includeAllColumns: false
//     };

//     sheet.getUnderlyingDataAsync(options).then(function(t){
//            table = t;
// var tgt = document.getElementById("dataTarget");
// tgt.innerHTML = "<h4>Underlying Data:</h4><p>" + JSON.stringify(table.getData()) + "</p>";
//     });

    $('#loading').addClass('hide');

}


})();
