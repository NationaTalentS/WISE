/**
 * Copyright (c) 2008-2017 Regents of the University of California (Regents).
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
package org.wise.portal.dao.notification;

import org.wise.portal.dao.SimpleDao;
import org.wise.portal.domain.group.Group;
import org.wise.portal.domain.run.Run;
import org.wise.portal.domain.workgroup.Workgroup;
import org.wise.vle.domain.notification.Notification;

import java.util.List;

/**
 * Domain Access Object for Notification
 * @author Hiroki Terashima
 */
public interface NotificationDao<T extends Notification> extends SimpleDao<T> {

  /**
   * Returns a list of notifications specified by params
   * @param id id of the notification in the db
   * @param run run this notification was created in
   * @param period period this notification was created in
   * @param toWorkgroup who should receive this notification
   * @param groupId parent group this notification belongs in
   * @param nodeId id of the node that generated this notification
   * @param componentId id of the component that generated this notification
   * @return a list of notifications that match the specified params
   */
  List<Notification> getNotificationListByParams(
    Integer id, Run run, Group period, Workgroup toWorkgroup,
    String groupId, String nodeId, String componentId);

  /**
   * Returns a list of Notification export rows
   * @param runId
   */
  List<Object[]> getNotificationExport(Integer runId);
}
