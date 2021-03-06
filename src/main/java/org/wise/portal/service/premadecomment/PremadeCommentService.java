/**
 * Copyright (c) 2007-2015 Regents of the University of California (Regents).
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
package org.wise.portal.service.premadecomment;

import java.util.Set;


import org.wise.portal.dao.ObjectNotFoundException;
import org.wise.portal.domain.premadecomment.PremadeComment;
import org.wise.portal.domain.premadecomment.PremadeCommentList;
import org.wise.portal.domain.premadecomment.impl.PremadeCommentListParameters;
import org.wise.portal.domain.premadecomment.impl.PremadeCommentParameters;
import org.wise.portal.domain.run.Run;
import org.wise.portal.domain.user.User;

/**
 * A service for working with <code>PremadeComment</code>
 * and <code>PremadeCommentList</code> objects.
 *
 * @author Patrick Lawler
 */
public interface PremadeCommentService {

  /**
   * Creates a new PremadeComment in the data store.
   *
   * @param params <code>PremadeCommentParameters</code>
   * @return PremadeComment
   */
  PremadeComment createPremadeComment(PremadeCommentParameters params);

  /**
   * Removes a PremadeComment from the data store using its id.
   *
   * @param commentID <code>Long</code>
   */
  void deletePremadeComment(Long commentID);

  /**
   * Updates the comment in a PremadeComment using its id.
   *
   * @param premadeCommentID <code>Long</code>
   * @param newComment <code>String</code>
   * @return updated PremadeComment
   */
  PremadeComment updatePremadeCommentMessage(Long premadeCommentID, String newComment)
      throws ObjectNotFoundException;

  /**
   * Updates the listPosition in a PremadeComment using its id.
   * @param premadeCommentId the id of the premade comment
   * @param listPosition the new list position
   * @return
   * @throws ObjectNotFoundException
   */
  PremadeComment updatePremadeCommentListPosition (Long premadeCommentId, Long listPosition)
      throws ObjectNotFoundException;

  /**
   * Updates the labels in a PremadeComment
   * @param premadeCommentId the id of the premade comment
   * @param labels the labels
   * @return
   * @throws ObjectNotFoundException
   */
  PremadeComment updatePremadeCommentLabels (Long premadeCommentId, String labels)
      throws ObjectNotFoundException;

  /**
   * Retrieves all PremadeComments from the data store.
   *
   * @return a Set<PremadeComment>
   */
  Set<PremadeComment> retrieveAllPremadeComments();

  /**
   * Retrieves all PremadeComments associated with a given user.
   *
   * @param user <code>User</code>
   * @return a Set<PremadeComment>
   */
  Set<PremadeComment> retrieveAllPremadeCommentsByUser(User user);

  /**
   * Creates a new PremadeCommentList in the data store.
   *
   * @param params <code>PremadeCommentListParameters</code>
   * @return PremadeCommentList
   */
  PremadeCommentList createPremadeCommentList(PremadeCommentListParameters params);

  /**
   * Removes a PremadeCommentList from the data store given its ID
   *
   * @param commentListID <code>Long</code>
   */
  void deletePremadeCommentList(Long commentListID) throws ObjectNotFoundException;

  /**
   * Updates the label of a PremadeCommentList given its ID
   * and new label.
   *
   * @param commentListID <code>Long</code>
   * @param newLabel <code>String</code>
   * @return PremadeCommentList
   */
  PremadeCommentList updatePremadeCommentListLabel(Long commentListID, String newLabel)
      throws ObjectNotFoundException;

  /**
   * Adds a PremadeComment to the PremadeCommentList given
   * the PremadeComment and the PremadeCommentList ID
   *
   * @param commentListID <code>Long</code>
   * @param premadeComment <code>PremadeComment</code>
   * @return PremadeCommentList
   */
  PremadeCommentList addPremadeCommentToList(Long commentListID, PremadeComment premadeComment)
      throws ObjectNotFoundException;

  /**
   * Removes a PremadeComment from the list of PremadeCommentList
   * given the PremadeCommentList ID and the PremadeComment
   *
   * @param commentListID <code>Long</code>
   * @param PremadeComment <code>PremadeComment</code>
   * @return PremadeCommentList
   */
  PremadeCommentList removePremadeCommentFromList(Long commentID, PremadeComment premadeComment)
      throws ObjectNotFoundException;

  /**
   * Retrieves all PremadeCommentLists from the data store.
   *
   * @return a Set<PremadeCommentList>
   */
  Set<PremadeCommentList> retrieveAllPremadeCommentLists();

  /**
   * Retrieves all PremadeCommentLists associated with a given user.
   *
   * @param user <code>User</code>
   * @return a Set<PremadeCommentList>
   */
  Set<PremadeCommentList> retrieveAllPremadeCommentListsByUser(User user);

  /**
   * Retrieves all PremadeCommentLists associated with a given project id
   * @param projectId
   * @return
   */
  Set<PremadeCommentList> retrieveAllPremadeCommentListsByProject(Long projectId);

  /**
   * Retrieves all PremadeCommentLists associated with a given run.
   *
   * @param run <code>Run</code>
   * @return a Set<PremadeCommentList>
   */
  Set<PremadeCommentList> retrieveAllPremadeCommentListsByRun(Run run);

  /**
   * Retrieves all PremadeCommentLists that have the global field set to true
   * @return a Set of PremadeCommentLists
   */
  Set<PremadeCommentList> retrieveAllGlobalPremadeCommentLists();

  /**
   * Retrieves a PremadeCommentList with the given id
   * @param id
   * @return a PremadeCommentList or null if there is no PremadeCommentList with
   * the given id
   */
  PremadeCommentList retrievePremadeCommentListById(Long id);

  /**
   * Retrieves a PremadeComment with the given id
   * @param id
   * @return a PremadeCommet or null if there is no PremadeComment with the
   * given id
   */
  PremadeComment retrievePremadeCommentById(Long id);

  /**
   * Copies all the PremadeCommentLists that are associated with a project id
   * @param fromProjectId the project id to copy from
   * @param toProjectId the project id to set in all the new PremadeCommentLists
   * @param toOwner the owner to set in all the new PremadeCommentLists
   */
  void copyPremadeCommentsFromProject(Long fromProjectId, Long toProjectId, User toOwner);

  /**
   * Make the name for a premade comment list given the project id
   * @param projectId the project id this list is for
   * @return the premade comment list name
   * e.g.
   *
   * project with a run
   * Project Id: 123, Run Id: 456, Chemical Reactions
   *
   * project without a run
   * Project Id: 123, Chemical Reactions
   */
  String makePremadeCommentListNameFromProjectId(Long projectId);
}
