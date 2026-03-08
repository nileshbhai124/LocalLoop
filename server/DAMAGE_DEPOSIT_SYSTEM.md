# Damage & Security Deposit System Documentation

## Overview
Comprehensive damage reporting and security deposit management system for LocalLoop rentals, ensuring fair handling of damaged items and automated deposit calculations.

## Key Policy
**"If a rented product is returned damaged, the repair cost will be deducted from the security deposit. If the damage exceeds the deposit value, the renter will be responsible for the remaining amount."**

## Features

### Security Deposit Management ✅
- Automatic deposit calculation (default: 50% of rental price)
- Deposit status tracking (pending, held, refunded, partially_refunded, forfeited)
- Automated refund calculations
- Deduction tracking
- Late fee integration

### Damage Reporting ✅
- Owner-initiated damage reports
- Damage severity levels (minor, moderate, major, total_loss)
- Photo evidence support
- Estimated and actual repair cost tracking
- Repair status monitoring
- Dispute mechanism

### Condition Tracking ✅
- Item condition at pickup
- Item condition at return
- Photo documentation
- Timestamp and user tracking
- Condition comparison

### Late Return Handling ✅
- Automatic late fee calculation
- Days late tracking
- Configurable late fee rates
- Integration with deposit deductions

## Database Schema

### Rental Model Enhancements

```javascript
{
  // Security Deposit
  securityDeposit: {
    amount: Number,              // Deposit amount
    status: String,              // pending, held, refunded, partially_refunded, forfeited
    refundedAmount: Number,      // Amount refunded
    deductedAmount: Number,      // Amount deducted
    refundedAt: Date,           // Refund timestamp
    notes: String               // Processing notes
  },
  
  // Damage Report
  damageReport: {
    reported: Boolean,           // Damage reported flag
    reportedBy: ObjectId,        // User who reported
    reportedAt: Date,           // Report timestamp
    description: String,         // Damage description
    severity: String,            // minor, moderate, major, total_loss
    images: [{                   // Evidence photos
      url: String,
      publicId: String
    }],
    estimatedRepairCost: Number, // Initial estimate
    actualRepairCost: Number,    // Final repair cost
    repairStatus: String,        // pending, in_progress, completed, not_required
    disputeStatus: String,       // none, disputed, resolved, escalated
    disputeReason: String,       // Borrower's dispute reason
    resolution: String           // Final resolution
  },
  
  // Condition Tracking
  conditionAtPickup: {
    condition: String,           // excellent, good, fair, poor
    notes: String,
    images: [{ url, publicId }],
    recordedAt: Date,
    recordedBy: ObjectId
  },
  
  conditionAtReturn: {
    condition: String,
    notes: String,
    images: [{ url, publicId }],
    recordedAt: Date,
    recordedBy: ObjectId
  },
  
  // Late Return
  lateReturn: {
    isLate: Boolean,
    daysLate: Number,
    lateFee: Number,
    lateFeeRate: Number          // Per day rate
  },
  
  actualReturnDate: Date
}
```

## API Endpoints

### 1. Report Damage
```http
POST /api/rentals/:id/report-damage
Authorization: Bearer <token>
Content-Type: application/json

{
  "description": "Scratches on the side panel and broken handle",
  "severity": "moderate",
  "estimatedRepairCost": 75,
  "images": [
    {
      "url": "https://cloudinary.com/damage1.jpg",
      "publicId": "localloop/damage/abc123"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Damage reported successfully",
  "data": {
    "_id": "rental_id",
    "damageReport": {
      "reported": true,
      "reportedBy": "owner_id",
      "reportedAt": "2024-03-15T10:00:00Z",
      "description": "Scratches on the side panel and broken handle",
      "severity": "moderate",
      "estimatedRepairCost": 75,
      "repairStatus": "pending",
      "disputeStatus": "none"
    }
  }
}
```

**Access:** Owner only

### 2. Update Repair Cost
```http
PUT /api/rentals/:id/damage/update-cost
Authorization: Bearer <token>
Content-Type: application/json

{
  "actualRepairCost": 85,
  "repairStatus": "completed"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Repair cost updated successfully",
  "data": {
    "damageReport": {
      "estimatedRepairCost": 75,
      "actualRepairCost": 85,
      "repairStatus": "completed"
    }
  }
}
```

**Access:** Owner only

### 3. Dispute Damage Report
```http
POST /api/rentals/:id/damage/dispute
Authorization: Bearer <token>
Content-Type: application/json

{
  "disputeReason": "The damage was pre-existing and documented at pickup"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Damage report disputed successfully",
  "data": {
    "damageReport": {
      "disputeStatus": "disputed",
      "disputeReason": "The damage was pre-existing and documented at pickup"
    }
  }
}
```

**Access:** Borrower only

### 4. Process Security Deposit
```http
POST /api/rentals/:id/process-deposit
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Security deposit processed successfully",
  "data": {
    "rental": {
      "securityDeposit": {
        "amount": 100,
        "status": "partially_refunded",
        "refundedAmount": 15,
        "deductedAmount": 85,
        "refundedAt": "2024-03-15T10:00:00Z",
        "notes": "Deposit processed. Refund: $15, Deductions: $85"
      }
    },
    "refundCalculation": {
      "depositAmount": 100,
      "repairCost": 85,
      "lateFee": 0,
      "totalDeductions": 85,
      "refundAmount": 15,
      "remainingOwed": 0
    }
  }
}
```

**Access:** Owner only

### 5. Calculate Deposit Refund
```http
GET /api/rentals/:id/deposit/calculate
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Deposit refund calculated successfully",
  "data": {
    "depositAmount": 100,
    "repairCost": 85,
    "lateFee": 0,
    "totalDeductions": 85,
    "refundAmount": 15,
    "remainingOwed": 0
  }
}
```

**Access:** Owner or Borrower

### 6. Record Pickup Condition
```http
POST /api/rentals/:id/condition/pickup
Authorization: Bearer <token>
Content-Type: application/json

{
  "condition": "good",
  "notes": "Minor scratches on handle, otherwise excellent",
  "images": [
    {
      "url": "https://cloudinary.com/pickup1.jpg",
      "publicId": "localloop/conditions/pickup123"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Pickup condition recorded successfully",
  "data": {
    "conditionAtPickup": {
      "condition": "good",
      "notes": "Minor scratches on handle, otherwise excellent",
      "recordedAt": "2024-03-10T09:00:00Z",
      "recordedBy": "user_id"
    },
    "status": "active"
  }
}
```

**Access:** Owner or Borrower

### 7. Record Return Condition
```http
POST /api/rentals/:id/condition/return
Authorization: Bearer <token>
Content-Type: application/json

{
  "condition": "fair",
  "notes": "Additional scratches and broken handle",
  "images": [
    {
      "url": "https://cloudinary.com/return1.jpg",
      "publicId": "localloop/conditions/return123"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Return condition recorded successfully",
  "data": {
    "conditionAtReturn": {
      "condition": "fair",
      "notes": "Additional scratches and broken handle",
      "recordedAt": "2024-03-15T09:00:00Z",
      "recordedBy": "user_id"
    },
    "actualReturnDate": "2024-03-15T09:00:00Z",
    "status": "completed",
    "lateReturn": {
      "isLate": false,
      "daysLate": 0,
      "lateFee": 0
    }
  }
}
```

**Access:** Owner or Borrower

### 8. Get Damage Report
```http
GET /api/rentals/:id/damage
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Damage report retrieved successfully",
  "data": {
    "reported": true,
    "reportedBy": {
      "_id": "owner_id",
      "name": "John Doe"
    },
    "reportedAt": "2024-03-15T10:00:00Z",
    "description": "Scratches and broken handle",
    "severity": "moderate",
    "estimatedRepairCost": 75,
    "actualRepairCost": 85,
    "repairStatus": "completed",
    "disputeStatus": "none"
  }
}
```

**Access:** Owner or Borrower

## Workflow

### Complete Rental Flow with Damage

1. **Rental Request Created**
   - Security deposit calculated (default: 50% of rental price)
   - Deposit status: `pending`

2. **Rental Approved**
   - Deposit status: `held`
   - Payment collected (rental + deposit)

3. **Item Pickup**
   - Record pickup condition
   - Take photos
   - Document any pre-existing damage
   - Rental status: `active`

4. **Item Return**
   - Record return condition
   - Take photos
   - Compare with pickup condition
   - Rental status: `completed`
   - Calculate late fees if applicable

5. **Damage Assessment** (if applicable)
   - Owner reports damage
   - Provides description and photos
   - Estimates repair cost
   - Borrower notified

6. **Dispute** (optional)
   - Borrower can dispute damage claim
   - Provide reason and evidence
   - Owner notified

7. **Repair** (if needed)
   - Owner gets item repaired
   - Updates actual repair cost

8. **Deposit Processing**
   - Calculate total deductions (repair + late fees)
   - Deduct from security deposit
   - Calculate refund amount
   - Process refund
   - Notify borrower

9. **Additional Payment** (if damage exceeds deposit)
   - Calculate remaining amount owed
   - Notify borrower
   - Collect additional payment

## Calculation Examples

### Example 1: No Damage, On-Time Return
```
Rental Price: $200
Security Deposit: $100
Damage Cost: $0
Late Fees: $0

Total Deductions: $0
Refund Amount: $100
Remaining Owed: $0
Deposit Status: refunded
```

### Example 2: Minor Damage, On-Time Return
```
Rental Price: $200
Security Deposit: $100
Damage Cost: $45
Late Fees: $0

Total Deductions: $45
Refund Amount: $55
Remaining Owed: $0
Deposit Status: partially_refunded
```

### Example 3: Major Damage, On-Time Return
```
Rental Price: $200
Security Deposit: $100
Damage Cost: $150
Late Fees: $0

Total Deductions: $150
Refund Amount: $0
Remaining Owed: $50
Deposit Status: forfeited
```

### Example 4: Damage + Late Return
```
Rental Price: $200
Security Deposit: $100
Damage Cost: $60
Late Fees: $30 (3 days × $10/day)

Total Deductions: $90
Refund Amount: $10
Remaining Owed: $0
Deposit Status: partially_refunded
```

### Example 5: Major Damage + Late Return
```
Rental Price: $200
Security Deposit: $100
Damage Cost: $180
Late Fees: $40 (4 days × $10/day)

Total Deductions: $220
Refund Amount: $0
Remaining Owed: $120
Deposit Status: forfeited
```

## Model Methods

### calculateLateFees()
```javascript
rental.calculateLateFees();
// Returns: late fee amount
// Updates: lateReturn.isLate, lateReturn.daysLate, lateReturn.lateFee
```

### calculateDepositRefund()
```javascript
const refund = rental.calculateDepositRefund();
// Returns: {
//   depositAmount,
//   repairCost,
//   lateFee,
//   totalDeductions,
//   refundAmount,
//   remainingOwed
// }
```

### isDamageExceedingDeposit()
```javascript
const exceeds = rental.isDamageExceedingDeposit();
// Returns: boolean
```

### getRemainingAmountOwed()
```javascript
const owed = rental.getRemainingAmountOwed();
// Returns: number (amount borrower still owes)
```

## Frontend Integration

### Damage Report Form
```typescript
const reportDamage = async (rentalId: string, damageData: DamageReport) => {
  const response = await fetch(
    `${API_URL}/api/rentals/${rentalId}/report-damage`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(damageData)
    }
  );
  
  return await response.json();
};
```

### Deposit Calculator
```typescript
const calculateRefund = async (rentalId: string) => {
  const response = await fetch(
    `${API_URL}/api/rentals/${rentalId}/deposit/calculate`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  
  const data = await response.json();
  return data.data; // refundCalculation object
};
```

### Condition Recording
```typescript
const recordCondition = async (
  rentalId: string,
  type: 'pickup' | 'return',
  conditionData: ConditionData
) => {
  const response = await fetch(
    `${API_URL}/api/rentals/${rentalId}/condition/${type}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(conditionData)
    }
  );
  
  return await response.json();
};
```

## Notifications

### Damage Reported
- **Recipient:** Borrower
- **Trigger:** Owner reports damage
- **Message:** "Damage has been reported on [Item]. Estimated repair cost: $[amount]"

### Repair Cost Updated
- **Recipient:** Borrower
- **Trigger:** Owner updates actual repair cost
- **Message:** "Actual repair cost: $[amount]"

### Damage Disputed
- **Recipient:** Owner
- **Trigger:** Borrower disputes damage
- **Message:** "[Borrower] has disputed the damage report"

### Deposit Processed
- **Recipient:** Borrower
- **Trigger:** Owner processes deposit
- **Message:** Detailed breakdown of refund/deductions

### Item Returned
- **Recipient:** Owner or Borrower
- **Trigger:** Return condition recorded
- **Message:** "[Item] has been returned and condition recorded"

## Security & Validation

### Access Control
- Only owner can report damage
- Only owner can update repair costs
- Only borrower can dispute damage
- Only owner can process deposits
- Both parties can record conditions
- Both parties can view damage reports

### Validation
- Rental must exist
- Rental must be in appropriate status
- User must be authorized
- Damage report must exist for updates
- Costs must be non-negative numbers

## Best Practices

### For Owners
1. Always record pickup condition with photos
2. Document pre-existing damage
3. Report damage promptly after return
4. Provide accurate repair estimates
5. Update actual costs after repairs
6. Process deposits within reasonable timeframe

### For Borrowers
1. Review pickup condition documentation
2. Take your own photos at pickup
3. Report any discrepancies immediately
4. Return items on time
5. Document return condition
6. Dispute unfair damage claims with evidence

## Testing

### Test Damage Report
```bash
curl -X POST http://localhost:3002/api/rentals/RENTAL_ID/report-damage \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Broken handle",
    "severity": "moderate",
    "estimatedRepairCost": 50
  }'
```

### Test Deposit Calculation
```bash
curl http://localhost:3002/api/rentals/RENTAL_ID/deposit/calculate \
  -H "Authorization: Bearer TOKEN"
```

### Test Condition Recording
```bash
curl -X POST http://localhost:3002/api/rentals/RENTAL_ID/condition/pickup \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "condition": "good",
    "notes": "Minor scratches on handle"
  }'
```

## Troubleshooting

### Deposit Not Calculating Correctly
- Verify actualReturnDate is set
- Check damage report costs
- Ensure late fees are calculated
- Review deposit amount

### Cannot Report Damage
- Verify user is owner
- Check rental status (must be active or completed)
- Ensure rental exists

### Dispute Not Working
- Verify user is borrower
- Check damage report exists
- Ensure not already disputed

---

**Status**: ✅ Production Ready
**Version**: 1.0.0
**Last Updated**: 2024
