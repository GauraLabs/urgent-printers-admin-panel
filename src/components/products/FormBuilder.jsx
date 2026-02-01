/**
 * Form Builder Component
 * Build custom form fields for template products
 */

import { useState } from 'react';
import { Plus, Trash2, GripVertical, Edit2, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';

const FIELD_TYPES = [
  { value: 'text', label: 'Text Input', icon: '📝' },
  { value: 'textarea', label: 'Long Text', icon: '📄' },
  { value: 'number', label: 'Number', icon: '🔢' },
  { value: 'email', label: 'Email', icon: '✉️' },
  { value: 'phone', label: 'Phone', icon: '📞' },
  { value: 'select', label: 'Dropdown', icon: '📋' },
  { value: 'checkbox', label: 'Checkbox', icon: '☑️' },
  { value: 'date', label: 'Date', icon: '📅' },
];

const FieldConfigDialog = ({ field, onSave, onClose, isOpen }) => {
  const [config, setConfig] = useState(field || {
    name: '',
    label: '',
    type: 'text',
    required: false,
    placeholder: '',
    helpText: '',
    options: [],
    validation: {}
  });

  const [newOption, setNewOption] = useState('');

  const handleSave = () => {
    // Generate name from label if empty
    if (!config.name && config.label) {
      config.name = config.label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    }
    onSave(config);
  };

  const addOption = () => {
    if (newOption.trim()) {
      setConfig({
        ...config,
        options: [...(config.options || []), newOption.trim()]
      });
      setNewOption('');
    }
  };

  const removeOption = (index) => {
    setConfig({
      ...config,
      options: config.options.filter((_, i) => i !== index)
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {field ? 'Edit Field' : 'Add New Field'}
          </DialogTitle>
          <DialogDescription>
            Configure the form field that customers will fill when ordering
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Field Type */}
          <div className="space-y-2">
            <Label htmlFor="type">Field Type *</Label>
            <Select
              value={config.type}
              onValueChange={(value) => setConfig({ ...config, type: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select field type" />
              </SelectTrigger>
              <SelectContent>
                {FIELD_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <span className="flex items-center gap-2">
                      <span>{type.icon}</span>
                      <span>{type.label}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Field Label */}
          <div className="space-y-2">
            <Label htmlFor="label">Field Label *</Label>
            <Input
              id="label"
              value={config.label}
              onChange={(e) => setConfig({ ...config, label: e.target.value })}
              placeholder="e.g., Your Name, Company Name"
            />
          </div>

          {/* Field Name (identifier) */}
          <div className="space-y-2">
            <Label htmlFor="name">Field Name (identifier)</Label>
            <Input
              id="name"
              value={config.name}
              onChange={(e) => setConfig({ ...config, name: e.target.value })}
              placeholder="e.g., customer_name, company_name"
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Leave empty to auto-generate from label
            </p>
          </div>

          {/* Placeholder */}
          <div className="space-y-2">
            <Label htmlFor="placeholder">Placeholder Text</Label>
            <Input
              id="placeholder"
              value={config.placeholder}
              onChange={(e) => setConfig({ ...config, placeholder: e.target.value })}
              placeholder="e.g., Enter your name"
            />
          </div>

          {/* Help Text */}
          <div className="space-y-2">
            <Label htmlFor="helpText">Help Text</Label>
            <Textarea
              id="helpText"
              value={config.helpText}
              onChange={(e) => setConfig({ ...config, helpText: e.target.value })}
              placeholder="Additional instructions for the customer"
              rows={2}
            />
          </div>

          {/* Required Checkbox */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="required"
              checked={config.required}
              onCheckedChange={(checked) => setConfig({ ...config, required: checked })}
            />
            <Label htmlFor="required" className="cursor-pointer">
              Required field
            </Label>
          </div>

          {/* Options for select/dropdown */}
          {config.type === 'select' && (
            <div className="space-y-2">
              <Label>Dropdown Options *</Label>
              <div className="space-y-2">
                {(config.options || []).map((option, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input value={option} disabled className="flex-1" />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeOption(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Input
                    value={newOption}
                    onChange={(e) => setNewOption(e.target.value)}
                    placeholder="Add an option"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addOption())}
                  />
                  <Button type="button" onClick={addOption} variant="outline">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Validation Rules */}
          {config.type === 'text' || config.type === 'textarea' ? (
            <div className="space-y-2">
              <Label>Validation (optional)</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="minLength" className="text-xs">Min Length</Label>
                  <Input
                    id="minLength"
                    type="number"
                    value={config.validation?.minLength || ''}
                    onChange={(e) => setConfig({
                      ...config,
                      validation: { ...config.validation, minLength: parseInt(e.target.value) || undefined }
                    })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="maxLength" className="text-xs">Max Length</Label>
                  <Input
                    id="maxLength"
                    type="number"
                    value={config.validation?.maxLength || ''}
                    onChange={(e) => setConfig({
                      ...config,
                      validation: { ...config.validation, maxLength: parseInt(e.target.value) || undefined }
                    })}
                    placeholder="100"
                  />
                </div>
              </div>
            </div>
          ) : null}

          {config.type === 'number' ? (
            <div className="space-y-2">
              <Label>Number Range (optional)</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="min" className="text-xs">Minimum</Label>
                  <Input
                    id="min"
                    type="number"
                    value={config.validation?.min || ''}
                    onChange={(e) => setConfig({
                      ...config,
                      validation: { ...config.validation, min: parseInt(e.target.value) || undefined }
                    })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="max" className="text-xs">Maximum</Label>
                  <Input
                    id="max"
                    type="number"
                    value={config.validation?.max || ''}
                    onChange={(e) => setConfig({
                      ...config,
                      validation: { ...config.validation, max: parseInt(e.target.value) || undefined }
                    })}
                    placeholder="1000"
                  />
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!config.label || (config.type === 'select' && (!config.options || config.options.length === 0))}
          >
            {field ? 'Update Field' : 'Add Field'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const FormFieldPreview = ({ field }) => {
  const renderField = () => {
    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
        return (
          <Input
            placeholder={field.placeholder || field.label}
            disabled
            className="bg-muted"
          />
        );
      case 'textarea':
        return (
          <Textarea
            placeholder={field.placeholder || field.label}
            disabled
            rows={3}
            className="bg-muted"
          />
        );
      case 'number':
        return (
          <Input
            type="number"
            placeholder={field.placeholder || field.label}
            disabled
            className="bg-muted"
          />
        );
      case 'select':
        return (
          <Select disabled>
            <SelectTrigger className="bg-muted">
              <SelectValue placeholder={field.placeholder || 'Select an option'} />
            </SelectTrigger>
          </Select>
        );
      case 'checkbox':
        return (
          <div className="flex items-center gap-2">
            <Checkbox disabled />
            <span className="text-sm text-muted-foreground">
              {field.placeholder || field.label}
            </span>
          </div>
        );
      case 'date':
        return (
          <Input
            type="date"
            disabled
            className="bg-muted"
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Label className="text-sm font-medium">
          {field.label}
          {field.required && <span className="text-destructive ml-1">*</span>}
        </Label>
      </div>
      {renderField()}
      {field.helpText && (
        <p className="text-xs text-muted-foreground">{field.helpText}</p>
      )}
    </div>
  );
};

const FormBuilder = ({ value = [], onChange }) => {
  const [fields, setFields] = useState(value);
  const [editingField, setEditingField] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const handleAddField = () => {
    setEditingField(null);
    setEditingIndex(null);
    setShowDialog(true);
  };

  const handleEditField = (field, index) => {
    setEditingField(field);
    setEditingIndex(index);
    setShowDialog(true);
  };

  const handleSaveField = (fieldConfig) => {
    let newFields;
    if (editingIndex !== null) {
      // Update existing field
      newFields = [...fields];
      newFields[editingIndex] = fieldConfig;
    } else {
      // Add new field
      newFields = [...fields, fieldConfig];
    }
    setFields(newFields);
    onChange(newFields);
    setShowDialog(false);
  };

  const handleDeleteField = (index) => {
    if (window.confirm('Are you sure you want to delete this field?')) {
      const newFields = fields.filter((_, i) => i !== index);
      setFields(newFields);
      onChange(newFields);
    }
  };

  const moveField = (index, direction) => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= fields.length) return;

    const newFields = [...fields];
    [newFields[index], newFields[newIndex]] = [newFields[newIndex], newFields[index]];
    setFields(newFields);
    onChange(newFields);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-base font-semibold">Customer Form Fields</Label>
          <p className="text-sm text-muted-foreground">
            Define what information customers need to provide when ordering this template
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </Button>
          <Button type="button" onClick={handleAddField} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Field
          </Button>
        </div>
      </div>

      {fields.length === 0 ? (
        <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
          <p className="text-muted-foreground mb-4">
            No form fields yet. Add fields to collect customer information.
          </p>
          <Button type="button" onClick={handleAddField} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Field
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {showPreview ? (
            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="font-semibold mb-4">Form Preview</h3>
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <FormFieldPreview key={index} field={field} />
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {fields.map((field, index) => {
                const fieldType = FIELD_TYPES.find(t => t.value === field.type);
                return (
                  <div
                    key={index}
                    className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 hover:bg-accent transition-colors"
                  >
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => moveField(index, 'up')}
                        disabled={index === 0}
                        className="p-1 hover:bg-background rounded disabled:opacity-30"
                      >
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{fieldType?.icon}</span>
                        <span className="font-medium">{field.label}</span>
                        {field.required && (
                          <span className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded">
                            Required
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          ({fieldType?.label})
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {field.helpText || field.placeholder || `Field name: ${field.name}`}
                      </p>
                    </div>

                    <div className="flex gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditField(field, index)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteField(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <FieldConfigDialog
        field={editingField}
        isOpen={showDialog}
        onSave={handleSaveField}
        onClose={() => setShowDialog(false)}
      />
    </div>
  );
};

export default FormBuilder;
