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
package org.wise.vle.domain.work;

import java.sql.Timestamp;

import javax.persistence.*;

import lombok.Getter;
import lombok.Setter;
import org.json.JSONException;
import org.json.JSONObject;
import org.wise.portal.domain.group.Group;
import org.wise.portal.domain.group.impl.PersistentGroup;
import org.wise.portal.domain.run.Run;
import org.wise.portal.domain.run.impl.RunImpl;
import org.wise.portal.domain.workgroup.Workgroup;
import org.wise.portal.domain.workgroup.impl.WorkgroupImpl;
import org.wise.vle.domain.PersistableDomain;

/**
 * Domain object representing work for a student, which include components and nodes (used in WISE5)
 * @author Hiroki Terashima
 */
@Entity
@Table(name = "studentWork",  indexes = {
    @Index(columnList = "runId", name = "studentWorkRunIdIndex"),
    @Index(columnList = "workgroupId", name = "studentWorkWorkgroupIdIndex")})
@Getter
@Setter
public class StudentWork extends PersistableDomain {

  @Id
  @GeneratedValue(strategy = GenerationType.AUTO)
  private Integer id = null;

  @ManyToOne(targetEntity = RunImpl.class, cascade = {CascadeType.PERSIST}, fetch = FetchType.LAZY)
  @JoinColumn(name = "runId", nullable = false)
  private Run run;

  @ManyToOne(targetEntity = PersistentGroup.class, cascade = {CascadeType.PERSIST}, fetch = FetchType.LAZY)
  @JoinColumn(name = "periodId", nullable = false)
  private Group period;

  @ManyToOne(targetEntity = WorkgroupImpl.class, cascade = {CascadeType.PERSIST}, fetch = FetchType.LAZY)
  @JoinColumn(name = "workgroupId", nullable = false)
  private Workgroup workgroup;

  @Column(name = "isAutoSave", nullable = false)
  private Boolean isAutoSave;

  @Column(name = "isSubmit", nullable = false)
  private Boolean isSubmit;

  @Column(name = "nodeId", nullable = false, length = 30)
  private String nodeId;

  @Column(name = "componentId", length = 30)
  private String componentId;

  @Column(name = "componentType", length = 30)
  private String componentType;

  @Column(name = "clientSaveTime", nullable = false)
  private Timestamp clientSaveTime;

  @Column(name = "serverSaveTime", nullable = false)
  private Timestamp serverSaveTime;

  @Column(name = "studentData", length = 5120000, columnDefinition = "mediumtext", nullable = false)
  private String studentData;

  @Override
  protected Class<?> getObjectClass() {
    return StudentWork.class;
  }

  /**
   * Get the JSON representation of the StudentWork
   * @return a JSONObject with the values from the StudentWork
   */
  public JSONObject toJSON() {
    JSONObject studentWorkJSONObject = new JSONObject();
    try {
      if (this.id != null) {
        studentWorkJSONObject.put("id", this.id);
      }

      if (this.run != null) {
        Long runId = this.run.getId();
        studentWorkJSONObject.put("runId", runId);
      }

      if (this.period != null) {
        Long periodId = this.period.getId();
        studentWorkJSONObject.put("periodId", periodId);
      }

      if (this.workgroup != null) {
        Long workgroupId = this.workgroup.getId();
        studentWorkJSONObject.put("workgroupId", workgroupId);
      }

      if (this.isAutoSave != null) {
        studentWorkJSONObject.put("isAutoSave", this.isAutoSave);
      }

      if (this.isSubmit != null) {
        studentWorkJSONObject.put("isSubmit", this.isSubmit);
      }

      if (this.nodeId != null) {
        studentWorkJSONObject.put("nodeId", this.nodeId);
      }

      if (this.componentId != null) {
        studentWorkJSONObject.put("componentId", this.componentId);
      }

      if (this.componentType != null) {
        studentWorkJSONObject.put("componentType", this.componentType);
      }

      if (this.clientSaveTime != null) {
        studentWorkJSONObject.put("clientSaveTime", clientSaveTime.getTime());
      }

      if (this.serverSaveTime != null) {
        studentWorkJSONObject.put("serverSaveTime", serverSaveTime.getTime());
      }

      if (this.studentData != null) {
        try {
          studentWorkJSONObject.put("studentData", new JSONObject(studentData));
        } catch (JSONException e) {
          studentWorkJSONObject.put("studentData", this.studentData);
        }
      }
    } catch (JSONException e) {
      e.printStackTrace();
    }
    return studentWorkJSONObject;
  }
}
