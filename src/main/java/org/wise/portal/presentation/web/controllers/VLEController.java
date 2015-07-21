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
package org.wise.portal.presentation.web.controllers;

import java.io.IOException;
import java.util.Properties;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.servlet.ModelAndView;
import org.wise.portal.dao.ObjectNotFoundException;
import org.wise.portal.domain.module.impl.CurnitGetCurnitUrlVisitor;
import org.wise.portal.domain.project.Project;
import org.wise.portal.domain.run.Run;
import org.wise.portal.service.offering.RunService;

/**
 * Controller for handling student VLE-portal interactions.
 * - launch preview, load student data url, etc.
 * 
 * @author Hiroki Terashima
 * @author Geoffrey Kwan
 */
@Controller
public class VLEController {

	@Autowired
	private RunService runService;
	
	@Autowired
	Properties wiseProperties;

	@RequestMapping(value={"/student.html", "/student/vle/vle.html", "/teacher/vle/vle.html"})
	protected ModelAndView handleRequestInternal(HttpServletRequest request,
			HttpServletResponse response) throws Exception {
		
	    String runIdString = request.getParameter("runId");
	    
        Run run = null;
	    
	    if (runIdString != null) {
	        // get the run
	        Long runId = Long.parseLong(runIdString);
	        run = this.runService.retrieveById(runId);
	    }
		
		String action = request.getParameter("action");
		if (action != null) {
			if (action.equals("getData")) {
				return handleGetData(request);
			} else  if (action.equals("postData")) {
				return handlePostData(request);
			} else if (action.equals("getRunExtras")) {
				return handleGetRunExtras(response, run);
			} else {
				throw new RuntimeException("should not get here");
			}
		} else if (run == null) {
		    // the run id was not provided so we will launch the preview project
		    return handleLaunchPreviewVLE(request);
		} else {
			return handleLaunchVLE(request, run);
		}
	}

	/**
	 * Retrns the RunExtras JSON string containing information like
	 * the maxscores that teacher defines
	 * @param response
	 * @param run
	 * @return
	 * @throws IOException 
	 */
	private ModelAndView handleGetRunExtras(
			HttpServletResponse response, Run run) throws IOException {
		response.setHeader("Cache-Control", "no-cache");
		response.setHeader("Pragma", "no-cache");
		response.setDateHeader("Expires", 0);

		String runExtras = run.getExtras();
		if (runExtras == null) {
			runExtras = "";
		}
		
		response.getWriter().print(runExtras);
		return null;
	}

	/**
	 * @param request
	 * @return
	 */
	private ModelAndView handlePostData(HttpServletRequest request) {
		String baseurl = ControllerUtil.getBaseUrlString(request);
		
		//get the context path e.g. /wise
		String contextPath = request.getContextPath();
		
		ModelAndView modelAndView = new ModelAndView("forward:" + baseurl + contextPath + "/postdata.html");
		return modelAndView;
	}

	/**
	 * @param request
	 * @return
	 */
	private ModelAndView handleGetData(HttpServletRequest request) {
		String baseurl = ControllerUtil.getBaseUrlString(request);
		
		//get the context path e.g. /wise
		String contextPath = request.getContextPath();
		
		ModelAndView modelAndView = new ModelAndView("forward:" + baseurl + contextPath + "/getdata.html");
		return modelAndView;
	}

	/**
	 * @param request
	 * @param run
	 * @return
	 * @throws ObjectNotFoundException 
	 */
	private ModelAndView handleLaunchVLE(HttpServletRequest request,
			Run run) throws ObjectNotFoundException {
		String wiseBaseURL = wiseProperties.getProperty("wiseBaseURL");
		String vleurl = wiseBaseURL + "/vle/vle.html";
		String vleConfigUrl = wiseBaseURL + "/vleconfig?runId=" + run.getId();

		String previewRequest = request.getParameter("preview");
		if (previewRequest != null && Boolean.valueOf(previewRequest)) {
			vleConfigUrl += "&mode=preview";
		} else {
			vleConfigUrl += "&mode=run";
		}
		
		//get the path to the project file
		String curriculumBaseWWW = wiseProperties.getProperty("curriculum_base_www");
		String rawProjectUrl = (String) run.getProject().getCurnit().accept(new CurnitGetCurnitUrlVisitor());
		String contentUrl = curriculumBaseWWW + rawProjectUrl;

		Project project = run.getProject();
		Integer wiseVersion = project.getWiseVersion();
		if ( wiseVersion == null || wiseVersion == 4) {
	        ModelAndView modelAndView = new ModelAndView("vle");
	        modelAndView.addObject("run", run);
	        modelAndView.addObject("vleurl",vleurl);
	        modelAndView.addObject("vleConfigUrl", vleConfigUrl);
	        modelAndView.addObject("contentUrl", contentUrl);
	        return modelAndView;
		} else {
		    ModelAndView modelAndView = new ModelAndView("student");
		    modelAndView.addObject("vleConfigUrl", vleConfigUrl);
		    return modelAndView;
		}
	}
	
    /**
     * Launches the project in preview mode
	 *
     * @param request the http request
     * @return the view to launch the vle in preview mode
     */
    private ModelAndView handleLaunchPreviewVLE(HttpServletRequest request) {
        
        // get the project id
        String projectId = request.getParameter("projectId");
        
        // get the vle config url
        String wiseBaseURL = wiseProperties.getProperty("wiseBaseURL");
        String vleConfigUrl = wiseBaseURL + "/vleconfig?projectId=" + projectId + "&mode=preview";
        
        // set the view to the student vle
        ModelAndView modelAndView = new ModelAndView("student");
        modelAndView.addObject("vleConfigUrl", vleConfigUrl);
        return modelAndView;
    }
}