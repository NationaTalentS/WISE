/**
 * Copyright (c) 2008-2015 Regents of the University of California (Regents).
 * Created by WISE, Graduate School of Education, University of California, Berkeley.
 *
 * This software is distributed under the GNU General Public License, v3,
 * or (at your option) any later version.
 *
 * Permission is hereby granted, without written agreement and without license
 * or royalty fees, to use, copy, modify, and distribute this software and its
 * documentation for any purpose, provided that the above copyright notice and
 * the following two paragraphs appear in all copies of this software.
 *
 * REGENTS SPECIFICALLY DISCLAIMS ANY WARRANTIES, INCLUDING, BUT NOT LIMITED TO,
 * THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE. THE SOFTWARE AND ACCOMPANYING DOCUMENTATION, IF ANY, PROVIDED
 * HEREUNDER IS PROVIDED "AS IS". REGENTS HAS NO OBLIGATION TO PROVIDE
 * MAINTENANCE, SUPPORT, UPDATES, ENHANCEMENTS, OR MODIFICATIONS.
 *
 * IN NO EVENT SHALL REGENTS BE LIABLE TO ANY PARTY FOR DIRECT, INDIRECT,
 * SPECIAL, INCIDENTAL, OR CONSEQUENTIAL DAMAGES, INCLUDING LOST PROFITS,
 * ARISING OUT OF THE USE OF THIS SOFTWARE AND ITS DOCUMENTATION, EVEN IF
 * REGENTS HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
package org.wise.vle.web;

import java.io.IOException;
import java.sql.Timestamp;
import java.util.Calendar;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.json.JSONException;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.ModelAndView;
import org.wise.portal.domain.user.User;
import org.wise.portal.presentation.web.controllers.ControllerUtil;
import org.wise.portal.service.vle.VLEService;
import org.wise.vle.domain.status.RunStatus;

@Controller
@RequestMapping("/runStatus")
public class RunStatusController {

  @Autowired
  private VLEService vleService;

  /**
   * Handle the GET requests
   * @param response
   */
  @RequestMapping(method = RequestMethod.GET)
  public ModelAndView doGet(
    @RequestParam(value = "runId") String runIdString,
    HttpServletResponse response) throws IOException {
    //get the signed in user
    User signedInUser = ControllerUtil.getSignedInUser();

    Long runId = null;
    String statusString = null;

    try {
      //get the run id as a Long
      runId = new Long(runIdString);
    } catch(NumberFormatException e) {
      e.printStackTrace();
    }

    if (runId == null) {
      /*
       * this request was most likely caused by a session timeout and the user logging
       * back in which makes a request to /runStatus without any parameters.
       * in this case we will just redirect the user back to the WISE home page.
       */
      return new ModelAndView("redirect:/");
    }

    boolean allowedAccess = false;

    /*
     * teachers that are owners of the run can make a request
     * students that are in the run can make a request
     */
    if (SecurityUtils.isAdmin(signedInUser)) {
      //the user is an admin so we will allow this request
      allowedAccess = true;
    } else if (SecurityUtils.isTeacher(signedInUser) && SecurityUtils.isUserOwnerOfRun(signedInUser, runId)) {
      //the user is a teacher that is an owner or shared owner of the run so we will allow this request
      allowedAccess = true;
    } else if (SecurityUtils.isStudent(signedInUser) && SecurityUtils.isUserInRun(signedInUser, runId)) {
      //the student is in the run so we will allow this request
      allowedAccess = true;
    }

    if (!allowedAccess) {
      //user is not allowed to make this request
      response.sendError(HttpServletResponse.SC_FORBIDDEN);
      return null;
    }

    //try to retrieve the run status for the run id
    RunStatus runStatus = vleService.getRunStatusByRunId(runId);

    if (runStatus == null) {
      //the run status for the run id has not been created yet so we will create it
      try {
        //create a JSONObject for the status
        JSONObject status = new JSONObject();

        //put the run id into the status
        status.put("runId", runId);

        //get the status as a string
        statusString = status.toString();

        //create the new run status
        runStatus = new RunStatus(runId, statusString);
        vleService.saveRunStatus(runStatus);
      } catch (JSONException e) {
        e.printStackTrace();
      }
    } else {
      //we have a run status so we will ge the status string
      statusString = runStatus.getStatus();
    }

    try {
      //write the status string to the response
      response.getWriter().print(statusString);
    } catch (IOException e) {
      e.printStackTrace();
    }
    return null;
  }

  /**
   * Handle the POST requests
   * @param response
   */
  @RequestMapping(method = RequestMethod.POST)
  public ModelAndView doPost(
    @RequestParam(value = "runId") String runIdString,
    @RequestParam(value = "status") String status,
    HttpServletResponse response) throws IOException {
    //get the signed in user
    User signedInUser = ControllerUtil.getSignedInUser();

    Long runId = null;

    try {
      //get the run id as a Long
      runId = new Long(runIdString);
    } catch(NumberFormatException e) {
      e.printStackTrace();
    }

    boolean allowedAccess = false;

    /*
     * teachers that are owners of the run can make a request
     * students can not make a request
     */
    if (SecurityUtils.isTeacher(signedInUser) && SecurityUtils.isUserOwnerOfRun(signedInUser, runId)) {
      //the user is a teacher that is an owner or shared owner of the run
      allowedAccess = true;
    }

    if (!allowedAccess) {
      //user is not allowed to make this request
      response.sendError(HttpServletResponse.SC_FORBIDDEN);
      return null;
    }

    if (runId != null && status != null) {
      //try to get the run status for the run id
      RunStatus runStatus = vleService.getRunStatusByRunId(runId);

      if (runStatus == null) {
        //the run status does not exist for the run id so we will create it
        runStatus = new RunStatus(runId, status);
      } else {
        //we have retrieved the run status so we will update the timestamp and status
        Calendar now = Calendar.getInstance();
        runStatus.setTimestamp(new Timestamp(now.getTimeInMillis()));
        runStatus.setStatus(status);
      }

      //save the run status to the db
      vleService.saveRunStatus(runStatus);
    }

    return null;
  }
}
